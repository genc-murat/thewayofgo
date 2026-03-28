import { useEffect, useRef } from 'react';

export type ShortcutContext = 'game' | 'lesson' | 'exercise' | 'global';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  action: string;
  context: ShortcutContext;
  description: string;
}

const SHORTCUTS: KeyboardShortcut[] = [
  { key: 'z', action: 'undo', context: 'game', description: 'Geri Al' },
  { key: 'p', action: 'pass', context: 'game', description: 'Pas' },
  { key: 'Escape', action: 'resign', context: 'game', description: 'Çekil' },
  { key: 'v', action: 'toggle-valid-moves', context: 'game', description: 'Geçerli Hamleleri Göster/Gizle' },
  { key: 'n', action: 'new-game', context: 'game', description: 'Yeni Oyun' },
  { key: 'ArrowLeft', action: 'prev', context: 'lesson', description: 'Önceki Adım' },
  { key: 'ArrowRight', action: 'next', context: 'lesson', description: 'Sonraki Adım' },
  { key: ' ', action: 'next', context: 'lesson', description: 'Sonraki Adım' },
  { key: 'h', action: 'hint', context: 'exercise', description: 'İpucu Göster' },
  { key: 'z', ctrl: true, action: 'undo-global', context: 'global', description: 'Geri Al (Global)' },
];

export interface UseKeyboardShortcutsOptions {
  context: ShortcutContext;
  onAction?: (action: string) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  context,
  onAction,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      for (const shortcut of SHORTCUTS) {
        if (shortcut.context !== context && shortcut.context !== 'global') continue;

        const keyMatch = e.key === shortcut.key || e.code === `Key${shortcut.key.toUpperCase()}`;
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);

        if (keyMatch && ctrlMatch) {
          e.preventDefault();
          onActionRef.current?.(shortcut.action);
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [context, enabled]);
}

export function getShortcutsForContext(context: ShortcutContext): KeyboardShortcut[] {
  return SHORTCUTS.filter(s => s.context === context || s.context === 'global');
}
