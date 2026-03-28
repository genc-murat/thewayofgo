export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    textPrimary: string;
    textSecondary: string;
    accent: string;
    accentHover: string;
    accentGlow: string;
    success: string;
    error: string;
    info: string;
    glass: string;
    glassBorder: string;
    surface0: string;
    surface1: string;
    surface2: string;
  };
  board: {
    gradientStart: string;
    gradientMid: string;
    gradientEnd: string;
    lineColor: string;
  };
}

export const THEMES: Record<string, Theme> = {
  dark: {
    id: 'dark',
    name: 'Koyu',
    description: 'Varsayılan koyu tema',
    colors: {
      bgPrimary: '#0f172a',
      bgSecondary: '#1e293b',
      bgCard: '#334155',
      textPrimary: '#f8fafc',
      textSecondary: '#94a3b8',
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
      success: '#22c55e',
      error: '#ef4444',
      info: '#3b82f6',
      glass: 'rgba(30, 41, 59, 0.6)',
      glassBorder: 'rgba(148, 163, 184, 0.1)',
      surface0: '#0b1120',
      surface1: '#131c31',
      surface2: '#1a2540',
    },
    board: {
      gradientStart: '#e8c860',
      gradientMid: '#d4a840',
      gradientEnd: '#e0b850',
      lineColor: '#5a3e1b',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Gece Yarısı',
    description: 'Koyu lacivert tema',
    colors: {
      bgPrimary: '#0a0a1a',
      bgSecondary: '#12122a',
      bgCard: '#1a1a3a',
      textPrimary: '#e8e8f0',
      textSecondary: '#8888aa',
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentGlow: 'rgba(59, 130, 246, 0.25)',
      success: '#22c55e',
      error: '#ef4444',
      info: '#8b5cf6',
      glass: 'rgba(18, 18, 42, 0.6)',
      glassBorder: 'rgba(136, 136, 170, 0.1)',
      surface0: '#06060f',
      surface1: '#0e0e1f',
      surface2: '#14142d',
    },
    board: {
      gradientStart: '#4a5568',
      gradientMid: '#2d3748',
      gradientEnd: '#4a5568',
      lineColor: '#a0aec0',
    },
  },
  forest: {
    id: 'forest',
    name: 'Orman',
    description: 'Doğal yeşil tema',
    colors: {
      bgPrimary: '#0a1a0a',
      bgSecondary: '#122212',
      bgCard: '#1a3a1a',
      textPrimary: '#e8f0e8',
      textSecondary: '#88aa88',
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentGlow: 'rgba(34, 197, 94, 0.25)',
      success: '#4ade80',
      error: '#ef4444',
      info: '#3b82f6',
      glass: 'rgba(18, 34, 18, 0.6)',
      glassBorder: 'rgba(136, 170, 136, 0.1)',
      surface0: '#060f06',
      surface1: '#0e1f0e',
      surface2: '#142d14',
    },
    board: {
      gradientStart: '#c4a44a',
      gradientMid: '#a88a30',
      gradientEnd: '#b89838',
      lineColor: '#4a3a1a',
    },
  },
  light: {
    id: 'light',
    name: 'Açık',
    description: 'Açık renkli tema',
    colors: {
      bgPrimary: '#f8fafc',
      bgSecondary: '#f1f5f9',
      bgCard: '#e2e8f0',
      textPrimary: '#1e293b',
      textSecondary: '#64748b',
      accent: '#d97706',
      accentHover: '#b45309',
      accentGlow: 'rgba(217, 119, 6, 0.25)',
      success: '#16a34a',
      error: '#dc2626',
      info: '#2563eb',
      glass: 'rgba(241, 245, 249, 0.8)',
      glassBorder: 'rgba(100, 116, 139, 0.15)',
      surface0: '#ffffff',
      surface1: '#f8fafc',
      surface2: '#f1f5f9',
    },
    board: {
      gradientStart: '#e8c860',
      gradientMid: '#d4a840',
      gradientEnd: '#e0b850',
      lineColor: '#5a3e1b',
    },
  },
};

export function applyTheme(themeId: string): void {
  const theme = THEMES[themeId];
  if (!theme) return;

  document.documentElement.setAttribute('data-theme', themeId);

  const root = document.documentElement;
  root.style.setProperty('--color-bg-primary', theme.colors.bgPrimary);
  root.style.setProperty('--color-bg-secondary', theme.colors.bgSecondary);
  root.style.setProperty('--color-bg-card', theme.colors.bgCard);
  root.style.setProperty('--color-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-accent-hover', theme.colors.accentHover);
  root.style.setProperty('--color-accent-glow', theme.colors.accentGlow);
  root.style.setProperty('--color-success', theme.colors.success);
  root.style.setProperty('--color-error', theme.colors.error);
  root.style.setProperty('--color-info', theme.colors.info);
  root.style.setProperty('--color-glass', theme.colors.glass);
  root.style.setProperty('--color-glass-border', theme.colors.glassBorder);
  root.style.setProperty('--color-surface-0', theme.colors.surface0);
  root.style.setProperty('--color-surface-1', theme.colors.surface1);
  root.style.setProperty('--color-surface-2', theme.colors.surface2);
}

export function getStoredTheme(): string {
  try {
    const stored = localStorage.getItem('thewayofgo_theme');
    return stored && THEMES[stored] ? stored : 'dark';
  } catch {
    return 'dark';
  }
}

export function storeTheme(themeId: string): void {
  try {
    localStorage.setItem('thewayofgo_theme', themeId);
  } catch {
    // ignore
  }
}
