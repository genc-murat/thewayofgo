import type { Variation, VariationPosition, BoardSize } from '../../types';
import { createBoardFromStones } from '../../utils/boardUtils';
import { Board } from '../Board';

interface VariantComparisonProps {
  position: VariationPosition;
  variations: Variation[];
}

export function VariantComparison({ position, variations }: VariantComparisonProps) {
  if (variations.length < 2) {
    return (
      <div className="text-center py-8 text-text-secondary">
        Karşılaştırma için en az 2 varyant seçili olmalı.
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <h4 className="text-sm font-semibold text-text-secondary">Karşılaştırma</h4>
        <span className="text-xs bg-info/15 text-info px-2 py-0.5 rounded-full">{variations.length} varyant</span>
      </div>

      <div className={`grid gap-6 ${
        variations.length <= 2 ? 'grid-cols-1 md:grid-cols-2' :
        variations.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {variations.map(v => {
          const finalStones = [...position.initial_stones, ...v.moves];
          const board = createBoardFromStones(finalStones, position.board_size);
          const lastMove = v.moves.length > 0 ? v.moves[v.moves.length - 1] : null;

          return (
            <div
              key={v.id}
              className={`glass rounded-2xl p-4 border transition-all ${
                v.is_best ? 'border-accent/40 glow-accent-sm' :
                v.evaluation === 'good' ? 'border-success/30' :
                v.evaluation === 'bad' ? 'border-error/30' :
                'border-info/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-lg">{v.id}</span>
                  <span className="text-sm text-text-secondary ml-2">{v.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {v.is_best && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">En İyi</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    v.evaluation === 'good' ? 'bg-success/15 text-success' :
                    v.evaluation === 'bad' ? 'bg-error/15 text-error' :
                    'bg-info/15 text-info'
                  }`}>
                    {v.evaluation === 'good' ? 'İyi' : v.evaluation === 'bad' ? 'Kötü' : 'Nötr'}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <Board
                  size={position.board_size as BoardSize}
                  board={board}
                  lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : null}
                  showCoordinates={true}
                />
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">{v.result_description}</p>
              <div className="flex items-center justify-between mt-2 text-xs text-text-secondary">
                <span>{v.moves.length} hamle</span>
                {v.territory_change && (
                  <span>
                    S:{v.territory_change.black > 0 ? '+' : ''}{v.territory_change.black} |
                    B:{v.territory_change.white > 0 ? '+' : ''}{v.territory_change.white}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
