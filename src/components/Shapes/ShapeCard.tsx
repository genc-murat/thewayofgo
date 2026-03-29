import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { GoShape, BoardSize } from '../../types';

interface ShapeCardProps {
  shape: GoShape;
  onClick: () => void;
}

export function ShapeCard({ shape, onClick }: ShapeCardProps) {
  const board = createBoardFromStones(shape.stones, shape.board_size);

  const categoryLabels: Record<string, string> = {
    connection: 'Bağlantı',
    eye_shape: 'Göz Şekli',
    attack: 'Saldırı',
    defense: 'Savunma',
    territory: 'Toprak',
    efficiency: 'Verimlilik',
  };

  const categoryColors: Record<string, string> = {
    connection: 'border-blue-500/30',
    eye_shape: 'border-emerald-500/30',
    attack: 'border-red-500/30',
    defense: 'border-cyan-500/30',
    territory: 'border-amber-500/30',
    efficiency: 'border-purple-500/30',
  };

  return (
    <button
      onClick={onClick}
      className={`glass rounded-2xl p-5 text-left card-hover border ${categoryColors[shape.category] || 'border-glass-border'} transition-all`}
    >
      <div className="w-full max-w-[140px] mx-auto mb-3">
        <Board
          size={shape.board_size as BoardSize}
          board={board}
          highlights={shape.highlights}
          showCoordinates={false}
        />
      </div>
      <h4 className="font-bold text-text-primary mb-1">{shape.name}</h4>
      {shape.name_jp && (
        <p className="text-xs text-text-secondary mb-2">{shape.name_jp}</p>
      )}
      <p className="text-sm text-text-secondary line-clamp-2">{shape.description}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/50 text-text-secondary">
          {categoryLabels[shape.category]}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
          Seviye {shape.level}
        </span>
      </div>
    </button>
  );
}
