import type { Variation } from '../../types';

interface VariantTreeProps {
  variations: Variation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function VariantTree({ variations, selectedId, onSelect }: VariantTreeProps) {
  const evalColors: Record<string, string> = {
    good: 'bg-success/15 text-success border-success/30',
    bad: 'bg-error/15 text-error border-error/30',
    neutral: 'bg-info/15 text-info border-info/30',
  };

  const evalLabels: Record<string, string> = {
    good: 'İyi',
    bad: 'Kötü',
    neutral: 'Nötr',
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary mb-3">Varyant Ağacı</h4>
      {variations.map(v => {
        const isSelected = v.id === selectedId;
        return (
          <button
            key={v.id}
            onClick={() => onSelect(v.id)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              isSelected
                ? 'glass border-accent/50 glow-accent-sm'
                : 'glass hover:border-glass-border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-text-primary">{v.id}</span>
                <span className="text-sm text-text-secondary">{v.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {v.is_best && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">En İyi</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${evalColors[v.evaluation]}`}>
                  {evalLabels[v.evaluation]}
                </span>
              </div>
            </div>
            <p className="text-xs text-text-secondary">{v.moves.length} hamle</p>
          </button>
        );
      })}
    </div>
  );
}
