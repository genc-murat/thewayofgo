import { useState, useEffect, useCallback } from 'react';
import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import { soundEngine } from '../../utils/soundEngine';
import type { VariationPosition, Variation, BoardSize, Stone } from '../../types';

interface VariantInteractiveProps {
  position: VariationPosition;
  variation: Variation;
}

type FeedbackState = {
  type: 'correct' | 'wrong' | 'idle';
  x: number;
  y: number;
} | null;

export function VariantInteractive({ position, variation }: VariantInteractiveProps) {
  const [moveIndex, setMoveIndex] = useState(-1);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [completed, setCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setMoveIndex(-1);
    setFeedback(null);
    setCompleted(false);
    setShowHint(false);
  }, [variation.id]);

  const nextExpectedMove = moveIndex + 1 < variation.moves.length
    ? variation.moves[moveIndex + 1]
    : null;

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

  const highlightPoints = (() => {
    const points: { x: number; y: number; type: 'good' | 'bad' }[] = [];
    if (feedback) {
      points.push({ x: feedback.x, y: feedback.y, type: feedback.type === 'correct' ? 'good' : 'bad' });
    }
    if (showHint && nextExpectedMove) {
      points.push({ x: nextExpectedMove.x, y: nextExpectedMove.y, type: 'good' });
    }
    return points;
  })();

  const handleIntersectionClick = useCallback((x: number, y: number) => {
    if (completed || !nextExpectedMove) return;

    if (x === nextExpectedMove.x && y === nextExpectedMove.y) {
      soundEngine.play('correct');
      setFeedback({ type: 'correct', x, y });
      setShowHint(false);
      const nextIdx = moveIndex + 1;
      setMoveIndex(nextIdx);

      if (nextIdx >= variation.moves.length - 1) {
        setCompleted(true);
      }

      setTimeout(() => setFeedback(null), 600);
    } else {
      soundEngine.play('wrong');
      setFeedback({ type: 'wrong', x, y });
      setTimeout(() => setFeedback(null), 800);
    }
  }, [completed, nextExpectedMove, moveIndex, variation.moves.length]);

  const handleReset = () => {
    setMoveIndex(-1);
    setFeedback(null);
    setCompleted(false);
    setShowHint(false);
  };

  const currentAnnotation = moveIndex >= 0 && variation.move_annotations?.[moveIndex]
    ? variation.move_annotations[moveIndex]
    : null;

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-text-secondary">İnteraktif Mod</h4>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary font-mono">
            {moveIndex + 1} / {variation.moves.length}
          </span>
        </div>
      </div>

      {completed ? (
        <div className="text-center py-6 animate-scale-in">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-bold text-success mb-2">Tebrikler!</h3>
          <p className="text-text-secondary text-sm mb-4">Tüm varyant hamlelerini doğru yaptınız.</p>
          <button
            onClick={handleReset}
            className="btn-secondary px-6 py-2 rounded-xl text-sm"
          >
            Tekrar Dene
          </button>
        </div>
      ) : (
        <>
          <div
            className={`mb-4 rounded-xl overflow-hidden transition-all ${
              feedback?.type === 'correct' ? 'glow-success' : feedback?.type === 'wrong' ? 'glow-error' : ''
            }`}
          >
            <Board
              size={position.board_size as BoardSize}
              board={board}
              interactive={true}
              onIntersectionClick={handleIntersectionClick}
              highlights={highlightPoints}
              showCoordinates={true}
              currentPlayer={nextExpectedMove?.color ?? 'black'}
            />
          </div>

          {currentAnnotation && (
            <div className="mb-4 text-sm text-text-secondary bg-bg-primary/40 rounded-lg p-3">
              {currentAnnotation}
            </div>
          )}

          {feedback?.type === 'wrong' && nextExpectedMove && (
            <div className="mb-4 text-sm text-error bg-error/10 rounded-lg p-3 animate-fade-in">
              Yanlış nokta! Doğru nokta ({nextExpectedMove.x}, {nextExpectedMove.y}) olmalıydı.
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="btn-ghost flex-1 py-2 rounded-xl text-sm"
            >
              {showHint ? 'İpucu Gizle' : 'İpucu Göster'}
            </button>
            <button
              onClick={handleReset}
              className="btn-ghost flex-1 py-2 rounded-xl text-sm"
            >
              Sıfırla
            </button>
          </div>
        </>
      )}
    </div>
  );
}
