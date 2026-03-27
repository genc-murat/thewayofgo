import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { TitleBar } from '../TitleBar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentView, setView } = useAppStore();

  const navItems = [
    { id: 'home' as const, label: 'Ana Sayfa' },
    { id: 'learn' as const, label: 'Öğren' },
    { id: 'play' as const, label: 'Oyna' },
    { id: 'exercise' as const, label: 'Alıştırma' },
    { id: 'progress' as const, label: 'İlerleme' },
  ];

  const icons: Record<string, React.ReactNode> = {
    home: (
      <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" /></svg>
    ),
    learn: (
      <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
    ),
    play: (
      <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
    ),
    exercise: (
      <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
    ),
    progress: (
      <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
    ),
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-0 text-text-primary">
      <TitleBar />
      <header className="glass-strong sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button onClick={() => setView('home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <GoLogo />
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">The Way of Go</h1>
              <p className="text-[10px] text-text-secondary tracking-widest uppercase">Go Yolculuğu</p>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-card/50">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-slow" />
              7 gün seri
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-card/50">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              24 yıldız
            </span>
          </div>
        </div>

        <nav className="border-t border-glass-border">
          <div className="max-w-7xl mx-auto px-6 flex">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  className={`nav-item flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                    isActive
                      ? 'text-accent active'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {icons[item.id]}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent glow-accent-sm" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 gradient-hero min-h-0">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <ErrorToast />
    </div>
  );
}

function GoLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="flex-shrink-0">
      <defs>
        <radialGradient id="logo-black" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        <radialGradient id="logo-white" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="100%" stopColor="#ccc" />
        </radialGradient>
      </defs>
      <circle cx="18" cy="18" r="17" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.5" />
      <circle cx="12" cy="14" r="7" fill="url(#logo-black)" />
      <circle cx="11" cy="13" r="3" fill="rgba(255,255,255,0.15)" />
      <circle cx="24" cy="22" r="7" fill="url(#logo-white)" />
      <circle cx="23" cy="21" r="3" fill="rgba(255,255,255,0.5)" />
    </svg>
  );
}

function ErrorToast() {
  const { error, setError } = useAppStore();
  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
      <div className="glass-strong rounded-xl px-5 py-3 flex items-center gap-3 glow-error">
        <svg className="w-5 h-5 text-error flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-sm text-error max-w-xs">{error}</span>
        <button onClick={() => setError(null)} className="text-text-secondary hover:text-text-primary ml-2">✕</button>
      </div>
    </div>
  );
}
