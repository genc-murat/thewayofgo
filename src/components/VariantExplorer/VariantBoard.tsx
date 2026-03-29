import { useState } from 'react';
import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { VariationPosition, Variation, BoardSize, Stone } from '../../types';

interface VariantBoardProps {
  position: VariationPosition;
  variation: Variation;
}

export function VariantBoard({ position, variation }: VariantBoardProps) {
  const [moveIndex, setMoveIndex] = useState(-1);

  const allStones = (() => {
    const stones: Stone[] = [...position.initial_stones];
    if (moveIndex >= 0) {
      for (let i = 0; i <= moveIndex && i < variation.moves.length; i++) {
        stones.push(variation.moves[i]);
      }
    }
    return stones;
  })();

  const board = createBoardFromStones(allStones, position.board_size);
  const lastMove = moveIndex >= 0 ? variation.moves[moveIndex] : null;

  return (
    <div>
      <div className="glass rounded-2xl p-4 mb-4">
        <Board
          size={position.board_size as BoardSize}
          board={board}
          lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : null}
          showCoordinates={true}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setMoveIndex(Math.max(-1, moveIndex - 1))}
          disabled={moveIndex <= -1}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <span className="text-sm text-text-secondary font-mono min-w-[60px] text-center">
          {moveIndex + 1} / {variation.moves.length}
        </span>

        <button
          onClick={() => setMoveIndex(Math.min(variation.moves.length - 1, moveIndex + 1))}
          disabled={moveIndex >= variation.moves.length - 1}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => setMoveIndex(variation.moves.length - 1)}
          className="px-3 py-1.5 rounded-lg glass text-xs text-text-secondary hover:text-text-primary transition-all"
        >
          Son
        </button>
      </div>

      {moveIndex >= 0 && variation.moves[moveIndex] && (
        <div className="mt-3 text-center text-sm text-text-secondary">
          <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${variation.moves[moveIndex].color === 'black' ? 'bg-stone-black' : 'bg-stone-white border border-gray-300'}`} />
          {variation.moves[moveIndex].color === 'black' ? 'Siyah' : 'Beyaz'} ({variation.moves[moveIndex].x}, {variation.moves[moveIndex].y})
        </div>
      )}
    </div>
  );
}
