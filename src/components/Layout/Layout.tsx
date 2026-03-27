import React from 'react';
import { useAppStore } from '../../stores/appStore';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { currentView, setView } = useAppStore();

  const navItems = [
    { id: 'home' as const, label: 'Ana Sayfa', icon: '🏠' },
    { id: 'learn' as const, label: 'Öğren', icon: '📚' },
    { id: 'play' as const, label: 'Oyna', icon: '🎮' },
    { id: 'exercise' as const, label: 'Alıştırma', icon: '✏️' },
    { id: 'progress' as const, label: 'İlerleme', icon: '📊' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary text-text-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-bg-card px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-stone-black to-stone-white border-2 border-accent" />
            <h1 className="text-xl font-bold tracking-tight">The Way of Go</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span>🔥 7 gün streak</span>
            <span>•</span>
            <span>⭐ 24 yıldız</span>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-bg-secondary border-b border-bg-card">
        <div className="max-w-7xl mx-auto flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                currentView === item.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-bg-card'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6">
        {children}
      </main>

      {/* Error toast */}
      <ErrorToast />
    </div>
  );
}

function ErrorToast() {
  const { error, setError } = useAppStore();

  if (!error) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-error text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-slide-up">
      <span>{error}</span>
      <button
        onClick={() => setError(null)}
        className="text-white/70 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
