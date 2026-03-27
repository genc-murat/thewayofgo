import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);
  let appWindow: ReturnType<typeof getCurrentWindow> | null = null;
  try {
    appWindow = getCurrentWindow();
  } catch {
    return null;
  }

  useEffect(() => {
    appWindow?.isMaximized().then(setIsMaximized);
  }, []);

  const handleMinimize = () => appWindow?.minimize();
  const handleMaximize = async () => {
    if (!appWindow) return;
    await appWindow.toggleMaximize();
    const maximized = await appWindow.isMaximized();
    setIsMaximized(maximized);
  };
  const handleClose = () => appWindow?.close();

  return (
    <div data-tauri-drag-region className="titlebar">
      <div data-tauri-drag-region className="titlebar-drag">
        <span className="titlebar-title">The Way of Go</span>
      </div>

      <div className="titlebar-controls">
        <button
          onClick={handleMinimize}
          className="titlebar-btn titlebar-btn-minimize"
          aria-label="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="2" y="5.5" width="8" height="1.2" rx="0.5" />
          </svg>
        </button>

        <button
          onClick={handleMaximize}
          className="titlebar-btn titlebar-btn-maximize"
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3.5" y="2" width="6" height="6" rx="0.8" />
              <path d="M2 5.5v3.5a1 1 0 001 1h3.5" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="2.5" y="2.5" width="7" height="7" rx="0.8" />
            </svg>
          )}
        </button>

        <button
          onClick={handleClose}
          className="titlebar-btn titlebar-btn-close"
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <path d="M3.5 2.5l-1.2 1.2 2.3 2.3-2.3 2.3 1.2 1.2 2.3-2.3 2.3 2.3 1.2-1.2-2.3-2.3 2.3-2.3-1.2-1.2-2.3 2.3-2.3-2.3z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
