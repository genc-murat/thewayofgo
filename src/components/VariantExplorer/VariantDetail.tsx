import { useState, useEffect } from 'react';
import { Board } from '../Board';
import { VariantBoard } from './VariantBoard';
import { VariantTree } from './VariantTree';
import { VariantComparison } from './VariantComparison';
import { VariantInteractive } from './VariantInteractive';
import { VariantQuiz } from './VariantQuiz';
import { createBoardFromStones } from '../../utils/boardUtils';
import { recordVariantExploration } from '../../utils/progressDb';
import type { VariationPosition, BoardSize } from '../../types';

interface VariantDetailProps {
  position: VariationPosition;
  onBack: () => void;
}

type ViewMode = 'watch' | 'try' | 'quiz';

export function VariantDetail({ position, onBack }: VariantDetailProps) {
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('watch');
  const [showComparison, setShowComparison] = useState(false);

  const selectedVariation = selectedVariationId
    ? position.variations.find(v => v.id === selectedVariationId) ?? null
    : null;

  useEffect(() => {
    if (selectedVariationId) {
      recordVariantExploration(position.id, selectedVariationId).catch(() => {});
    }
  }, [selectedVariationId, position.id]);

  useEffect(() => {
    setSelectedVariationId(null);
    setViewMode('watch');
    setShowComparison(false);
  }, [position.id]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">Kataloğa Dön</span>
        </button>
        <h2 className="text-3xl font-bold mb-2">{position.title}</h2>
        <p className="text-text-secondary">{position.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left panel - Board */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          <div className="glass rounded-2xl p-4">
            <Board
              size={position.board_size as BoardSize}
              board={createBoardFromStones(position.initial_stones, position.board_size)}
              showCoordinates={true}
            />
          </div>

          {selectedVariation && viewMode === 'watch' && (
            <VariantBoard position={position} variation={selectedVariation} />
          )}
        </div>

        {/* Right panel - Info */}
        <div className="flex-1 space-y-6">
          {/* Mode selector */}
          <div className="glass rounded-2xl p-1 flex gap-1">
            {([
              { mode: 'watch' as ViewMode, label: 'İzle', icon: '👁' },
              { mode: 'try' as ViewMode, label: 'Dene', icon: '🎮' },
              { mode: 'quiz' as ViewMode, label: 'Test Et', icon: '❓', disabled: !position.quiz },
            ]).map(({ mode, label, icon, disabled }) => (
              <button
                key={mode}
                onClick={() => !disabled && setViewMode(mode)}
                disabled={disabled}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  viewMode === mode
                    ? 'bg-accent text-bg-primary'
                    : disabled
                      ? 'text-text-secondary/40 cursor-not-allowed'
                      : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="mr-1.5">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Variation info card */}
          {selectedVariation && viewMode === 'watch' && (
            <div className="glass rounded-2xl p-6 border border-glass-border animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-lg">{selectedVariation.id}</span>
                <span className="text-sm text-text-secondary">— {selectedVariation.label}</span>
                {selectedVariation.is_best && (
                  <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">En İyi</span>
                )}
              </div>
              <p className="text-text-secondary leading-relaxed">{selectedVariation.result_description}</p>
              {selectedVariation.territory_change && (
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="text-stone-black dark:text-white">
                    Siyah: {selectedVariation.territory_change.black > 0 ? '+' : ''}{selectedVariation.territory_change.black}
                  </span>
                  <span className="text-stone-white">
                    Beyaz: {selectedVariation.territory_change.white > 0 ? '+' : ''}{selectedVariation.territory_change.white}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Interactive mode */}
          {viewMode === 'try' && selectedVariation && (
            <VariantInteractive position={position} variation={selectedVariation} />
          )}

          {/* Quiz mode */}
          {viewMode === 'quiz' && position.quiz && (
            <VariantQuiz position={position} />
          )}

          {/* Variation tree */}
          {viewMode !== 'quiz' && (
            <div className="glass rounded-2xl p-6 border border-glass-border">
              <VariantTree
                variations={position.variations}
                selectedId={selectedVariationId}
                onSelect={(id) => {
                  setSelectedVariationId(id);
                  setShowComparison(false);
                  if (viewMode === 'try') setViewMode('watch');
                }}
              />

              {position.variations.length >= 2 && (
                <button
                  onClick={() => setShowComparison(!showComparison)}
                  className="mt-4 btn-secondary w-full py-2.5 rounded-xl text-sm"
                >
                  {showComparison ? 'Karşılaştırmayı Kapat' : 'Tüm Varyantları Karşılaştır'}
                </button>
              )}
            </div>
          )}

          {/* Comparison */}
          {showComparison && viewMode !== 'quiz' && (
            <div className="glass rounded-2xl p-6 border border-glass-border animate-fade-in">
              <VariantComparison position={position} variations={position.variations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
