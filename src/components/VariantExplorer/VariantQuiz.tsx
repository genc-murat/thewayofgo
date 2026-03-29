import { useState, useCallback, useEffect } from 'react';
import { Board } from '../Board';
import { createBoardFromStones } from '../../utils/boardUtils';
import { soundEngine } from '../../utils/soundEngine';
import { recordVariantQuizResult } from '../../utils/progressDb';
import type { VariationPosition, BoardSize } from '../../types';

interface VariantQuizProps {
  position: VariationPosition;
}

export function VariantQuiz({ position }: VariantQuizProps) {
  const quiz = position.quiz!;
  const correctVariation = position.variations.find(v => v.id === quiz.correct_variation_id);
  const correctFirstMove = correctVariation?.moves[0];

  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedX, setSelectedX] = useState(-1);
  const [selectedY, setSelectedY] = useState(-1);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedX(-1);
    setSelectedY(-1);
    setShowHint(false);
  }, [position.id]);

  const board = createBoardFromStones(position.initial_stones, position.board_size);

  const highlightPoints = (() => {
    const points: { x: number; y: number; type: 'good' | 'bad' }[] = [];
    if (answered) {
      points.push({ x: selectedX, y: selectedY, type: isCorrect ? 'good' : 'bad' });
      if (!isCorrect && correctFirstMove) {
        points.push({ x: correctFirstMove.x, y: correctFirstMove.y, type: 'good' });
      }
    }
    return points;
  })();

  const handleIntersectionClick = useCallback((x: number, y: number) => {
    if (answered || !correctFirstMove) return;

    const correct = x === correctFirstMove.x && y === correctFirstMove.y;
    setIsCorrect(correct);
    setSelectedX(x);
    setSelectedY(y);
    setAnswered(true);

    soundEngine.play(correct ? 'correct' : 'wrong');
    recordVariantQuizResult(position.id, correct).catch(() => {});
  }, [answered, correctFirstMove, position.id]);

  const handleReset = () => {
    setAnswered(false);
    setIsCorrect(false);
    setSelectedX(-1);
    setSelectedY(-1);
    setShowHint(false);
  };

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border animate-fade-in">
      <h4 className="text-sm font-semibold text-text-secondary mb-3">Quiz Modu</h4>

      <div className="mb-4 bg-bg-primary/40 rounded-lg p-4">
        <p className="text-text-primary font-medium">{quiz.question}</p>
      </div>

      {!answered ? (
        <>
          <div className={`mb-4 rounded-xl overflow-hidden ${showHint ? 'ring-2 ring-accent/50' : ''}`}>
            <Board
              size={position.board_size as BoardSize}
              board={board}
              interactive={true}
              onIntersectionClick={handleIntersectionClick}
              highlights={showHint && correctFirstMove ? [{ x: correctFirstMove.x, y: correctFirstMove.y, type: 'good' }] : []}
              showCoordinates={true}
            />
          </div>

          {quiz.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="btn-ghost w-full py-2 rounded-xl text-sm"
            >
              {showHint ? 'İpucu Gizle' : 'İpucu Göster'}
            </button>
          )}

          {showHint && quiz.hint && (
            <div className="mt-2 text-sm text-accent bg-accent/10 rounded-lg p-3 animate-fade-in">
              💡 {quiz.hint}
            </div>
          )}
        </>
      ) : (
        <div className="animate-scale-in">
          <div className={`rounded-xl overflow-hidden mb-4 ${isCorrect ? 'glow-success' : 'glow-error'}`}>
            <Board
              size={position.board_size as BoardSize}
              board={board}
              highlights={highlightPoints}
              showCoordinates={true}
            />
          </div>

          {isCorrect ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-success mb-2">Doğru!</h3>
              <p className="text-text-secondary text-sm">
                {correctVariation?.result_description}
              </p>
            </div>
          ) : (
            <div className="py-4">
              <div className="text-center mb-3">
                <div className="text-3xl mb-2">❌</div>
                <h3 className="text-lg font-bold text-error mb-1">Yanlış</h3>
              </div>
              <p className="text-text-secondary text-sm mb-2">
                Sizin seçiminiz: ({selectedX}, {selectedY})
              </p>
              <p className="text-success text-sm mb-2">
                Doğru hamle: ({correctFirstMove?.x}, {correctFirstMove?.y})
              </p>
              <p className="text-text-secondary text-sm">
                {correctVariation?.result_description}
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="btn-secondary w-full py-2.5 rounded-xl text-sm mt-4"
          >
            Tekrar Dene
          </button>
        </div>
      )}
    </div>
  );
}
