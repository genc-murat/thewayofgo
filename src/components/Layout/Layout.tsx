import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { TitleBar } from '../TitleBar';
import { LoadingOverlay } from '../LoadingOverlay';

interface LayoutProps {
  children: React.ReactNode;
}

type NavItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ReactNode;
  children: NavItem[];
};

type NavEntry =
  | { type: 'item'; item: NavItem }
  | { type: 'group'; group: NavGroup };

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
  settings: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
  ),
  openings: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
  ),
  glossary: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2zm1-5a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1z" clipRule="evenodd" /></svg>
  ),
  'reading-ladder': (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-3.14 1.345.002.002 5.86 2.513a1 1 0 00.788 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0z" /></svg>
  ),
  shapes: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM10 6a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" /></svg>
  ),
  variants: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a2 2 0 000-2.828L13.485 5.1a2 2 0 00-2.828 0L10 5.757v8.486zM16 18H9.071l6-6H16a2 2 0 012 2v2a2 2 0 01-2 2z" clipRule="evenodd" /></svg>
  ),
  srs: (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" /></svg>
  ),
  'position-editor': (
    <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
  ),
};

const chevronIcon = (
  <svg className="w-3 h-3 transition-transform duration-200" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
);

const navEntries: NavEntry[] = [
  { type: 'item', item: { id: 'home', label: 'Ana Sayfa', icon: icons.home } },
  {
    type: 'group',
    group: {
      id: 'learn',
      label: 'Öğren',
      icon: icons.learn,
      children: [
        { id: 'learn', label: 'Dersler', icon: icons.learn },
        { id: 'exercise', label: 'Alıştırma', icon: icons.exercise },
        { id: 'srs-review', label: 'SRS Tekrar', icon: icons.srs },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'explore',
      label: 'Keşfet',
      icon: icons.glossary,
      children: [
        { id: 'glossary', label: 'Sözlük', icon: icons.glossary },
        { id: 'reading-ladder', label: 'Okuma Merdiveni', icon: icons['reading-ladder'] },
        { id: 'shapes', label: 'Şekiller', icon: icons.shapes },
        { id: 'variants', label: 'Varyantlar', icon: icons.variants },
        { id: 'openings', label: 'Açılıslar', icon: icons.openings },
      ],
    },
  },
  {
    type: 'group',
    group: {
      id: 'play',
      label: 'Oyna',
      icon: icons.play,
      children: [
        { id: 'play', label: 'Oyna', icon: icons.play },
        { id: 'position-editor', label: 'Pozisyon Düzenle', icon: icons['position-editor'] },
      ],
    },
  },
  { type: 'item', item: { id: 'progress', label: 'İlerleme', icon: icons.progress } },
  { type: 'item', item: { id: 'settings', label: 'Ayarlar', icon: icons.settings } },
];

function isViewActive(currentView: string, itemIds: string[]): boolean {
  return itemIds.includes(currentView);
}

function DropdownNav({
  group,
  currentView,
  onSelect,
}: {
  group: NavGroup;
  currentView: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const childIds = group.children.map((c) => c.id);
  const isActive = isViewActive(currentView, childIds);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`nav-item flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all relative ${
          isActive ? 'text-accent active' : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {group.icon}
        <span>{group.label}</span>
        <span className={`ml-0.5 ${open ? 'rotate-180' : ''}`} style={{ display: 'flex' }}>
          {chevronIcon}
        </span>
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent glow-accent-sm" />
        )}
      </button>

      {open && (
        <div className="dropdown-menu absolute top-full left-0 mt-1 min-w-[180px] py-1.5 rounded-xl glass-strong animate-dropdown-open z-50">
          {group.children.map((child) => {
            const isChildActive = currentView === child.id;
            return (
              <button
                key={child.id}
                onClick={() => {
                  onSelect(child.id);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${
                  isChildActive
                    ? 'text-accent bg-accent/10'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
                }`}
              >
                {child.icon}
                <span>{child.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MobileNav({
  currentView,
  onSelect,
  onClose,
}: {
  currentView: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className="mobile-nav-overlay fixed inset-0 z-40 md:hidden" onClick={onClose}>
      <div
        className="mobile-nav-panel absolute top-0 right-0 h-full w-72 bg-surface-1 border-l border-glass-border animate-slide-in-right overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <span className="text-sm font-semibold text-text-primary">Menü</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navEntries.map((entry) => {
            if (entry.type === 'item') {
              const isItemActive = currentView === entry.item.id;
              return (
                <button
                  key={entry.item.id}
                  onClick={() => {
                    onSelect(entry.item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isItemActive
                      ? 'text-accent bg-accent/10 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
                  }`}
                >
                  {entry.item.icon}
                  <span>{entry.item.label}</span>
                </button>
              );
            }

            const group = entry.group;
            const childIds = group.children.map((c) => c.id);
            const isGroupActive = isViewActive(currentView, childIds);
            const isExpanded = expandedGroups.has(group.id);

            return (
              <div key={group.id}>
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isGroupActive
                      ? 'text-accent bg-accent/10 font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {group.icon}
                    <span>{group.label}</span>
                  </span>
                  <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    {chevronIcon}
                  </span>
                </button>
                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-glass-border space-y-0.5 mt-1 mb-1">
                    {group.children.map((child) => {
                      const isChildActive = currentView === child.id;
                      return (
                        <button
                          key={child.id}
                          onClick={() => {
                            onSelect(child.id);
                            onClose();
                          }}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                            isChildActive
                              ? 'text-accent bg-accent/10 font-medium'
                              : 'text-text-secondary hover:text-text-primary hover:bg-bg-card/50'
                          }`}
                        >
                          {child.icon}
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const { currentView, setView } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigate = (id: string) => {
    setView(id as any);
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

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-card transition-colors"
            aria-label="Menü aç"
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
          </button>
        </div>

        <nav className="border-t border-glass-border hidden md:block">
          <div className="max-w-7xl mx-auto px-6 flex">
            {navEntries.map((entry) => {
              if (entry.type === 'item') {
                const isActive = currentView === entry.item.id;
                return (
                  <button
                    key={entry.item.id}
                    onClick={() => handleNavigate(entry.item.id)}
                    className={`nav-item flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all relative ${
                      isActive ? 'text-accent active' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {entry.item.icon}
                    <span>{entry.item.label}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-accent glow-accent-sm" />
                    )}
                  </button>
                );
              }

              return (
                <DropdownNav
                  key={entry.group.id}
                  group={entry.group}
                  currentView={currentView}
                  onSelect={handleNavigate}
                />
              );
            })}
          </div>
        </nav>
      </header>

      {mobileMenuOpen && (
        <MobileNav
          currentView={currentView}
          onSelect={handleNavigate}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full p-6 gradient-hero min-h-0">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <LoadingOverlay />
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
