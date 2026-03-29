import { useState, useEffect, useRef, useCallback } from 'react';
import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { VariationPosition, Variation, BoardSize, Stone, StoneColor } from '../../types';

interface VariantBoardProps {
  position: VariationPosition;
  variation: Variation;
}

export function VariantBoard({ position, variation }: VariantBoardProps) {
  const [moveIndex, setMoveIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setMoveIndex(-1);
    setIsPlaying(false);
  }, [variation.id]);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setMoveIndex(prev => {
          if (prev >= variation.moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, variation.moves.length]);

  const handleTogglePlay = useCallback(() => {
    if (moveIndex >= variation.moves.length - 1) {
      setMoveIndex(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [moveIndex, isPlaying, variation.moves.length]);

  const allStones: Stone[] = (() => {
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

  const moveNumbers: { x: number; y: number; num: number; color: StoneColor }[] = [];
  if (moveIndex >= 0) {
    for (let i = 0; i <= moveIndex && i < variation.moves.length; i++) {
      moveNumbers.push({
        x: variation.moves[i].x,
        y: variation.moves[i].y,
        num: i + 1,
        color: variation.moves[i].color,
      });
    }
  }

  const currentAnnotation = moveIndex >= 0 && variation.move_annotations?.[moveIndex]
    ? variation.move_annotations[moveIndex]
    : null;

  return (
    <div>
      <div className="glass rounded-2xl p-4 mb-4">
        <div className="relative">
          <Board
            size={position.board_size as BoardSize}
            board={board}
            lastMove={lastMove ? { x: lastMove.x, y: lastMove.y } : null}
            showCoordinates={true}
          />
          {/* Move number overlays rendered as absolute-positioned divs */}
          {moveNumbers.map((mn) => (
            <MoveNumberOverlay
              key={`move-${mn.num}-${mn.x}-${mn.y}`}
              x={mn.x}
              y={mn.y}
              num={mn.num}
              color={mn.color}
              boardSize={position.board_size}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <button
          onClick={() => { setMoveIndex(-1); setIsPlaying(false); }}
          disabled={moveIndex <= -1}
          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all text-xs"
          title="Başa dön"
        >
          ⏮
        </button>
        <button
          onClick={() => { setMoveIndex(Math.max(-1, moveIndex - 1)); setIsPlaying(false); }}
          disabled={moveIndex <= -1}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={handleTogglePlay}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-accent hover:text-accent-hover transition-all"
        >
          {isPlaying ? (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={() => { setMoveIndex(Math.min(variation.moves.length - 1, moveIndex + 1)); setIsPlaying(false); }}
          disabled={moveIndex >= variation.moves.length - 1}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={() => { setMoveIndex(variation.moves.length - 1); setIsPlaying(false); }}
          disabled={moveIndex >= variation.moves.length - 1}
          className="w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all text-xs"
          title="Son hamle"
        >
          ⏭
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-center gap-4 mb-3">
        <span className="text-sm text-text-secondary font-mono min-w-[60px] text-center">
          {moveIndex + 1} / {variation.moves.length}
        </span>
        <div className="flex-1 h-1 bg-bg-primary/50 rounded-full overflow-hidden max-w-[120px]">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: variation.moves.length > 0 ? `${((moveIndex + 1) / variation.moves.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* Annotation */}
      {currentAnnotation && (
        <div className="mt-2 text-center text-sm text-text-secondary bg-bg-primary/40 rounded-lg p-2.5 animate-fade-in">
          {currentAnnotation}
        </div>
      )}

      {/* Current move info */}
      {moveIndex >= 0 && lastMove && !currentAnnotation && (
        <div className="mt-3 text-center text-sm text-text-secondary">
          <span className={`inline-block w-3 h-3 rounded-full mr-1.5 ${lastMove.color === 'black' ? 'bg-stone-black' : 'bg-stone-white border border-gray-300'}`} />
          {lastMove.color === 'black' ? 'Siyah' : 'Beyaz'} ({lastMove.x}, {lastMove.y})
        </div>
      )}

      {/* Territory change indicator */}
      {variation.territory_change && (
        <div className="mt-3 flex justify-center gap-4 text-xs text-text-secondary">
          <span>Siyah: {variation.territory_change.black > 0 ? '+' : ''}{variation.territory_change.black}</span>
          <span>Beyaz: {variation.territory_change.white > 0 ? '+' : ''}{variation.territory_change.white}</span>
        </div>
      )}
    </div>
  );
}

function MoveNumberOverlay({ x, y, num, color, boardSize }: { x: number; y: number; num: number; color: StoneColor; boardSize: number }) {
  const cellSize = 32;
  const padding = 32;
  const px = padding + x * cellSize;
  const py = padding + y * cellSize;
  const boardPixels = cellSize * (boardSize - 1) + padding * 2;

  return (
    <div
      className="absolute pointer-events-none flex items-center justify-center"
      style={{
        left: `${(px / boardPixels) * 100}%`,
        top: `${(py / boardPixels) * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: '18px',
        height: '18px',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontSize: '9px',
          color: color === 'black' ? '#fff' : '#1a1a1a',
          textShadow: color === 'black' ? '0 0 2px rgba(0,0,0,0.5)' : '0 0 2px rgba(255,255,255,0.5)',
          lineHeight: 1,
        }}
      >
        {num}
      </span>
    </div>
  );
}
