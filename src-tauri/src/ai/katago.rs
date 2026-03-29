use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
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

#[derive(Debug, Clone, serde::Serialize)]
pub struct MoveEvaluation {
    pub move_str: String,
    pub x: u8,
    pub y: u8,
    pub visits: u32,
    pub win_rate: f64,
    pub score_mean: f64,
    pub is_best: bool,
    pub quality: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct PositionAnalysisResult {
    pub evaluations: Vec<MoveEvaluation>,
    pub best_move: String,
    pub score_mean: f64,
    pub turn: String,
}

pub struct KataGoEngine {
    stdin_tx: mpsc::Sender<(String, Option<oneshot::Sender<String>>)>,
    pub status: Arc<Mutex<EngineStatus>>,
    expecting_analyze: Arc<AtomicBool>,
    analyze_info_lines: Arc<Mutex<String>>,
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

        let expecting_analyze = Arc::new(AtomicBool::new(false));
        let expecting_analyze_clone = Arc::clone(&expecting_analyze);
        let analyze_info_lines: Arc<Mutex<String>> = Arc::new(Mutex::new(String::new()));
        let analyze_info_clone = Arc::clone(&analyze_info_lines);

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
                                    if expecting_analyze_clone.load(Ordering::SeqCst) {
                                        let info = analyze_info_clone.lock().await.clone();
                                        expecting_analyze_clone.store(false, Ordering::SeqCst);
                                        let _ = tx.send(format!("{}\n{}", info, response[1..].trim()));
                                    } else {
                                        let _ = tx.send(response[1..].trim().to_string());
                                    }
                                }
                            } else if response.starts_with('?') {
                                let mut p = pending_clone.lock().await;
                                if !p.is_empty() {
                                    let tx = p.remove(0);
                                    expecting_analyze_clone.store(false, Ordering::SeqCst);
                                    let _ = tx.send(format!("ERROR: {}", response[1..].trim()));
                                }
                            } else if expecting_analyze_clone.load(Ordering::SeqCst) {
                                let mut info = analyze_info_clone.lock().await;
                                if !info.is_empty() {
                                    info.push('\n');
                                }
                                info.push_str(&response);
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
            expecting_analyze,
            analyze_info_lines,
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

    pub async fn analyze_position(&self, board_size: u8, komi: f32) -> Result<PositionAnalysisResult, String> {
        self.expecting_analyze.store(true, Ordering::SeqCst);
        *self.analyze_info_lines.lock().await = String::new();

        let cmd = format!(
            "kata-analyze {} info 20 maxMoves 10",
            if komi == komi.floor() {
                format!("komi {:.0}", komi)
            } else {
                format!("komi {:.1}", komi)
            }
        );

        let response = self.send_command(cmd).await?;
        self.expecting_analyze.store(false, Ordering::SeqCst);
        parse_kata_analyze_response(&response, board_size)
    }

    pub async fn analyze_move(&self, _color: &str, _vertex: &str, board_size: u8, komi: f32) -> Result<MoveEvaluation, String> {
        self.expecting_analyze.store(true, Ordering::SeqCst);
        *self.analyze_info_lines.lock().await = String::new();

        let cmd = format!(
            "kata-analyze {} info 20 maxMoves 1",
            if komi == komi.floor() {
                format!("komi {:.0}", komi)
            } else {
                format!("komi {:.1}", komi)
            }
        );

        let response = self.send_command(cmd).await?;
        self.expecting_analyze.store(false, Ordering::SeqCst);
        let result = parse_kata_analyze_response(&response, board_size)?;

        result.evaluations.into_iter().next()
            .ok_or_else(|| "No move evaluation returned".to_string())
    }
}

fn gtp_to_coords(s: &str, board_size: u8) -> Result<(u8, u8), String> {
    let chars: Vec<char> = s.chars().collect();
    if chars.len() < 2 {
        return Err(format!("Invalid GTP coordinate: {}", s));
    }
    let col_char = chars[0].to_ascii_uppercase();
    let col = if col_char > 'I' {
        col_char as u8 - b'A' - 1
    } else {
        col_char as u8 - b'A'
    };
    let row_str: String = chars[1..].iter().collect();
    let row_num: u8 = row_str.parse().map_err(|_| format!("Failed to parse row: {}", s))?;
    let row = board_size - row_num;
    Ok((col, row))
}

fn coords_to_gtp(x: u8, y: u8, board_size: u8) -> String {
    let col_char = (b'A' + if x >= 8 { x + 1 } else { x }) as char;
    format!("{}{}", col_char, board_size - y)
}

pub fn sync_board_state<'a>(engine: &'a KataGoEngine, game: &'a crate::engine::game::GoGame) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<(), String>> + Send + 'a>> {
    Box::pin(async move {
        let history = game.get_move_history();
        let board_size = game.board_size().to_u8();

        engine.clear_board().await?;
        engine.set_board_size(board_size).await?;

        for (i, m) in history.iter().enumerate() {
            let color = if i % 2 == 0 { "B" } else { "W" };

            if m.move_type == crate::engine::types::MoveType::Stone {
                let mx = m.x.unwrap_or(0);
                let my = m.y.unwrap_or(0);
                let vertex = coords_to_gtp(mx, my, board_size);
                engine.play_move(color, &vertex).await?;
            } else if m.move_type == crate::engine::types::MoveType::Pass {
                engine.play_move(color, "pass").await?;
            }
        }

        Ok(())
    })
}

fn parse_kata_analyze_response(response: &str, board_size: u8) -> Result<PositionAnalysisResult, String> {
    let mut evaluations = Vec::new();
    let mut turn = "B".to_string();

    for line in response.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }

        if line.starts_with("turn") {
            if let Some(t) = line.split_whitespace().nth(1) {
                turn = t.to_string();
            }
            continue;
        }

        if !line.starts_with("info") {
            continue;
        }

        let parts: Vec<&str> = line.split_whitespace().collect();
        let mut i = 1;
        while i < parts.len() {
            if parts[i] == "move" && i + 1 < parts.len() {
                let move_str = parts[i + 1].to_string();
                let (x, y) = gtp_to_coords(&move_str, board_size).unwrap_or((255, 255));
                let mut visits = 0u32;
                let mut win_rate = 0.5f64;
                let mut score_mean = 0.0f64;

                i += 2;
                while i < parts.len() && parts[i] != "move" && parts[i] != "turn" {
                    match parts[i] {
                        "visits" if i + 1 < parts.len() => {
                            visits = parts[i + 1].parse().unwrap_or(0);
                            i += 2;
                        }
                        "winrate" if i + 1 < parts.len() => {
                            win_rate = parts[i + 1].parse().unwrap_or(0.5);
                            i += 2;
                        }
                        "scoreMean" if i + 1 < parts.len() => {
                            score_mean = parts[i + 1].parse().unwrap_or(0.0);
                            i += 2;
                        }
                        _ => { i += 1; }
                    }
                }

                evaluations.push(MoveEvaluation {
                    move_str,
                    x,
                    y,
                    visits,
                    win_rate,
                    score_mean,
                    is_best: false,
                    quality: "unknown".to_string(),
                });
            } else {
                i += 1;
            }
        }
    }

    if evaluations.is_empty() {
        return Err("No evaluations parsed from kata-analyze response".to_string());
    }

    let max_visits = evaluations.iter().map(|e| e.visits).max().unwrap_or(0);
    let best_wr = evaluations.iter().map(|e| e.win_rate).fold(0.0f64, f64::max);

    for eval in &mut evaluations {
        eval.is_best = eval.visits == max_visits && max_visits > 0;
        let diff = best_wr - eval.win_rate;
        eval.quality = if diff < 0.005 {
            "best".to_string()
        } else if diff < 0.02 {
            "good".to_string()
        } else if diff < 0.05 {
            "acceptable".to_string()
        } else if diff < 0.10 {
            "mistake".to_string()
        } else {
            "blunder".to_string()
        };
    }

    let best_move = evaluations.iter()
        .find(|e| e.is_best)
        .map(|e| e.move_str.clone())
        .unwrap_or_default();

    let score_mean = evaluations.iter()
        .find(|e| e.is_best)
        .map(|e| e.score_mean)
        .unwrap_or(0.0);

    Ok(PositionAnalysisResult {
        evaluations,
        best_move,
        score_mean,
        turn,
    })
}
