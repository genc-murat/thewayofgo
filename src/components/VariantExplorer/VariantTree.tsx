import { useState } from 'react';
import type { Variation } from '../../types';

interface VariantTreeProps {
  variations: Variation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

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

export function VariantTree({ variations, selectedId, onSelect }: VariantTreeProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-text-secondary mb-3">Varyant Ağacı</h4>
      {variations.map(v => (
        <VariationNode
          key={v.id}
          variation={v}
          depth={0}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function VariationNode({
  variation,
  depth,
  selectedId,
  onSelect,
}: {
  variation: Variation;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = variation.id === selectedId;
  const hasSubVariations = variation.sub_variations && variation.sub_variations.length > 0;

  return (
    <div className={depth > 0 ? 'branch-line' : ''}>
      <button
        onClick={() => onSelect(variation.id)}
        className={`w-full text-left p-4 rounded-xl border transition-all ${
          isSelected
            ? 'glass border-accent/50 glow-accent-sm'
            : 'glass hover:border-glass-border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-text-primary">{variation.id}</span>
            <span className="text-sm text-text-secondary">{variation.label}</span>
          </div>
          <div className="flex items-center gap-2">
            {variation.is_best && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">En İyi</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${evalColors[variation.evaluation]}`}>
              {evalLabels[variation.evaluation]}
            </span>
          </div>
        </div>
        <p className="text-xs text-text-secondary">{variation.moves.length} hamle</p>
      </button>

      {hasSubVariations && (
        <div className="ml-4 mt-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 mb-1"
          >
            <svg
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            {variation.sub_variations!.length} alt varyant
          </button>
          {expanded && (
            <div className="space-y-2 animate-fade-in">
              {variation.sub_variations!.map(sub => (
                <VariationNode
                  key={sub.id}
                  variation={sub}
                  depth={depth + 1}
                  selectedId={selectedId}
                  onSelect={onSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
