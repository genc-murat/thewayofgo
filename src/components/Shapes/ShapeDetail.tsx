import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { GoShape, BoardSize } from '../../types';

interface ShapeDetailProps {
  shape: GoShape;
  onBack: () => void;
}

export function ShapeDetail({ shape, onBack }: ShapeDetailProps) {
  const board = createBoardFromStones(shape.stones, shape.board_size);

  const categoryLabels: Record<string, string> = {
    connection: 'Bağlantı',
    eye_shape: 'Göz Şekli',
    attack: 'Saldırı',
    defense: 'Savunma',
    territory: 'Toprak',
    efficiency: 'Verimlilik',
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
      >
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Şekil Kataloğu
      </button>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-80 flex-shrink-0">
          <div className="glass rounded-2xl p-6">
            <Board
              size={shape.board_size as BoardSize}
              board={board}
              highlights={shape.highlights}
              showCoordinates={true}
            />
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{shape.name}</h2>
              <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
                Seviye {shape.level}
              </span>
            </div>
            {shape.name_jp && (
              <p className="text-sm text-text-secondary">{shape.name_jp}</p>
            )}
            <span className="inline-block text-xs bg-bg-primary/50 text-text-secondary px-3 py-1 rounded-full mt-2">
              {categoryLabels[shape.category]}
            </span>
          </div>

          <div className="glass rounded-2xl p-6 border border-glass-border">
            <h3 className="font-semibold text-text-primary mb-3">Açıklama</h3>
            <p className="text-text-secondary leading-relaxed">{shape.description}</p>
          </div>

          <div className="glass rounded-2xl p-6 border border-glass-border">
            <h3 className="font-semibold text-text-primary mb-3">Anahtar Noktalar</h3>
            <ul className="space-y-2">
              {shape.key_points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-text-secondary text-sm">
                  <span className="text-accent mt-0.5">•</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-6 border border-glass-border">
            <h3 className="font-semibold text-text-primary mb-3">Ne Zaman Kullanılır</h3>
            <p className="text-text-secondary leading-relaxed">{shape.when_to_use}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
