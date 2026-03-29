use std::sync::Arc;
use tokio::sync::{mpsc, oneshot, Mutex};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineStatus {
    Starting,
    Ready,
    Error,
}

impl EngineStatus {
    pub fn is_healthy(&self) -> bool {
        matches!(self, EngineStatus::Starting | EngineStatus::Ready)
    }
}

pub struct KataGoEngine {
    stdin_tx: mpsc::Sender<(String, Option<oneshot::Sender<String>>)>,
    pub status: Arc<Mutex<EngineStatus>>,
}

impl KataGoEngine {
    pub fn is_healthy(&self) -> bool {
        if self.stdin_tx.is_closed() {
            return false;
        }
        if let Some(s) = self.status.try_lock().ok() {
            s.is_healthy()
        } else {
            true
        }
    }

    pub async fn get_status(&self) -> EngineStatus {
        let s = self.status.lock().await;
        *s
    }

    pub async fn new(app_handle: &AppHandle) -> Result<Self, String> {
        let shell = app_handle.shell();

        let resource_dir = app_handle.path().resource_dir().map_err(|e: tauri::Error| e.to_string())?;
        let model_path = resource_dir.join("resources/katago_model.bin.gz");
        let config_path = resource_dir.join("resources/gtp_custom.cfg");

        let cmd = shell.sidecar("katago").map_err(|e| e.to_string())?
            .args([
                "gtp",
                "-model", model_path.to_str().unwrap_or("resources/katago_model.bin.gz"),
                "-config", config_path.to_str().unwrap_or("resources/gtp_custom.cfg")
            ]);

        let (mut rx, mut child) = cmd.spawn().map_err(|e| e.to_string())?;

        let (stdin_tx, mut stdin_rx) = mpsc::channel::<(String, Option<oneshot::Sender<String>>)>(100);
        let status: Arc<Mutex<EngineStatus>> = Arc::new(Mutex::new(EngineStatus::Starting));
        let status_for_reader = Arc::clone(&status);
        let status_for_reader2 = Arc::clone(&status);

        let pending_responses: Arc<Mutex<Vec<oneshot::Sender<String>>>> = Arc::new(Mutex::new(Vec::new()));
        let pending_clone = Arc::clone(&pending_responses);

        // Task to read stdout/stderr from KataGo
        tokio::spawn(async move {
            let mut buffer = String::new();
            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(line) => {
                        let line_str = String::from_utf8_lossy(&line);
                        buffer.push_str(&line_str);

                        while let Some(pos) = buffer.find("\n\n") {
                            let response = buffer[..pos].trim().to_string();
                            buffer = buffer[pos + 2..].to_string();

                            if response.is_empty() {
                                continue;
                            }

                            if response.starts_with('=') {
                                let mut p = pending_clone.lock().await;
                                if !p.is_empty() {
                                    let tx = p.remove(0);
                                    let _ = tx.send(response[1..].trim().to_string());
                                }
                            } else if response.starts_with('?') {
                                let mut p = pending_clone.lock().await;
                                if !p.is_empty() {
                                    let tx = p.remove(0);
                                    let _ = tx.send(format!("ERROR: {}", response[1..].trim()));
                                }
                            }
                        }

                        let mut s = status_for_reader.lock().await;
                        if *s == EngineStatus::Starting {
                            *s = EngineStatus::Ready;
                        }
                    }
                    CommandEvent::Stderr(line) => {
                        let err_str = String::from_utf8_lossy(&line);
                        if err_str.contains("Loaded model") {
                            let mut s = status_for_reader.lock().await;
                            *s = EngineStatus::Ready;
                        }
                    }
                    CommandEvent::Terminated(exit_status) => {
                        eprintln!("KataGo process terminated: {:?}", exit_status);
                        let mut s = status_for_reader2.lock().await;
                        *s = EngineStatus::Error;
                        let mut p = pending_clone.lock().await;
                        for tx in p.drain(..) {
                            let _ = tx.send("ERROR: KataGo process terminated".to_string());
                        }
                        break;
                    }
                    _ => {}
                }
            }
        });

        // Task to write to KataGo's stdin
        tokio::spawn(async move {
            while let Some((cmd, response_tx)) = stdin_rx.recv().await {
                if let Some(tx) = response_tx {
                    let mut p = pending_responses.lock().await;
                    p.push(tx);
                }

                let cmd_with_newline = format!("{}\n", cmd);
                if let Err(e) = child.write(cmd_with_newline.as_bytes()) {
                    eprintln!("Failed to write to KataGo: {}", e);
                    break;
                }
            }
        });

        // Wait briefly to detect immediate startup failure (missing libs, bad model, etc.)
        tokio::time::sleep(std::time::Duration::from_secs(2)).await;

        let engine = Self {
            stdin_tx,
            status,
        };

        if !engine.is_healthy() {
            return Err(
                "KataGo failed to start. The binary requires OpenCL (libOpenCL.so.1). \
                 Install it with: sudo apt install ocl-icd-libopencl1 \
                 Or use a CPU-only KataGo build.".to_string()
            );
        }

        Ok(engine)
    }

    pub async fn send_command(&self, cmd: String) -> Result<String, String> {
        if self.stdin_tx.is_closed() {
            return Err("KataGo engine is not running (channel closed)".to_string());
        }

        let (tx, rx) = oneshot::channel();
        self.stdin_tx.send((cmd, Some(tx))).await
            .map_err(|_| "KataGo engine is not running (failed to send command)".to_string())?;

        rx.await.map_err(|_| "KataGo engine terminated while waiting for response".to_string())
    }

    pub async fn play_move(&self, color: &str, vertex: &str) -> Result<(), String> {
        let response = self.send_command(format!("play {} {}", color, vertex)).await?;
        if response.starts_with("ERROR") {
            return Err(response);
        }
        Ok(())
    }

    pub async fn gen_move(&self, color: &str) -> Result<String, String> {
        self.send_command(format!("genmove {}", color)).await
    }

    pub async fn set_board_size(&self, size: u8) -> Result<(), String> {
        self.send_command(format!("boardsize {}", size)).await?;
        Ok(())
    }

    pub async fn clear_board(&self) -> Result<(), String> {
        self.send_command("clear_board".to_string()).await?;
        Ok(())
    }
}
