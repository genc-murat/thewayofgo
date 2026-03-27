import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, Exercise, StoneColor, Highlight } from '../../types';

export function LessonViewer() {
  const { currentLesson, lessonStep, nextStep, prevStep, setView, loadLesson } = useAppStore();
  const [exerciseCompleted, setExerciseCompleted] = useState(false);
  const [showExercise, setShowExercise] = useState(false);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [exerciseResult, setExerciseResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [hintsShown, setHintsShown] = useState(0);

  // Reset exercise state when lesson changes
  useEffect(() => {
    setExerciseCompleted(false);
    setShowExercise(false);
    setExercise(null);
    setExerciseResult(null);
    setHintsShown(0);
  }, [currentLesson?.id]);

  // Load exercise when showing it
  useEffect(() => {
    if (showExercise && currentLesson?.required_exercise && !exercise) {
      import(`../../data/exercises/${currentLesson.required_exercise}.json`).then((mod) => {
        setExercise(mod.default || mod);
      });
    }
  }, [showExercise, currentLesson?.required_exercise, exercise]);

  const handleBoardClick = useCallback(
    (x: number, y: number) => {
      if (!exercise || exerciseResult) return;

      // Check if this move is correct
      const matchedMove = exercise.correct_moves.find((m) => m.x === x && m.y === y);
      if (matchedMove) {
        setExerciseResult({
          correct: matchedMove.is_correct,
          explanation: matchedMove.explanation,
        });
        if (matchedMove.is_correct) {
          setExerciseCompleted(true);
        }
      } else {
        setExerciseResult({
          correct: false,
          explanation: 'Bu hamle beklenen seçenekler arasında değil. Tekrar deneyin.',
        });
      }
    },
    [exercise, exerciseResult]
  );

  const resetExercise = () => {
    setExerciseResult(null);
  };

  if (!currentLesson) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary mb-4">Henüz bir ders seçilmedi.</p>
        <button onClick={() => setView('home')} className="text-accent hover:text-accent-hover">
          Ana sayfaya dön
        </button>
      </div>
    );
  }

  const content = currentLesson.content[lessonStep];
  const isLastStep = lessonStep === currentLesson.content.length - 1;
  const hasRequiredExercise = !!currentLesson.required_exercise;
  const totalSteps = currentLesson.content.length + (hasRequiredExercise ? 1 : 0);
  const currentProgress = showExercise ? currentLesson.content.length + 1 : lessonStep + 1;
  const progress = (currentProgress / totalSteps) * 100;

  // Show exercise at the end
  if (showExercise && exercise) {
    const boardSize = exercise.board_size as BoardSize;
    const board = createBoardFromStones(exercise.initial_stones, boardSize);

    const highlights: Highlight[] = [];
    if (exerciseResult && !exerciseResult.correct) {
      const correctMove = exercise.correct_moves.find((m) => m.is_correct);
      if (correctMove) {
        highlights.push({ x: correctMove.x, y: correctMove.y, type: 'good' });
      }
    }

    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <span className="bg-accent/20 text-accent px-2 py-0.5 rounded font-medium">Alıştırma</span>
          </div>
          <h2 className="text-2xl font-bold">{exercise.title}</h2>
          <p className="text-text-secondary">{exercise.description}</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-right text-xs text-text-secondary mt-1">
            Alıştırma
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Board */}
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-md">
              <Board
                size={boardSize}
                board={board}
                highlights={highlights}
                onIntersectionClick={handleBoardClick}
                interactive={!exerciseCompleted}
                showCoordinates={true}
              />
            </div>
          </div>

          {/* Side panel */}
          <div className="lg:w-72 space-y-4">
            {/* Result */}
            {exerciseResult && (
              <div
                className={`rounded-xl p-4 border ${
                  exerciseResult.correct
                    ? 'bg-success/10 border-success'
                    : 'bg-error/10 border-error'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{exerciseResult.correct ? '✓' : '✗'}</span>
                  <span className="font-semibold">
                    {exerciseResult.correct ? 'Doğru!' : 'Yanlış'}
                  </span>
                </div>
                <p className="text-sm">{exerciseResult.explanation}</p>
                {!exerciseResult.correct && (
                  <button
                    onClick={resetExercise}
                    className="mt-3 w-full py-2 rounded-lg bg-bg-primary hover:bg-bg-secondary text-sm transition-colors"
                  >
                    Tekrar Dene
                  </button>
                )}
              </div>
            )}

            {/* Hints */}
            {!exerciseCompleted && (
              <div className="bg-bg-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">İpuçları</span>
                  <span className="text-xs text-text-secondary">
                    {hintsShown}/{exercise?.hints.length || 0}
                  </span>
                </div>
                {hintsShown > 0 && exercise && (
                  <div className="space-y-2 mb-3">
                    {exercise.hints.slice(0, hintsShown).map((hint, i) => (
                      <p key={i} className="text-sm text-text-secondary bg-bg-primary rounded p-2">
                        💡 {hint}
                      </p>
                    ))}
                  </div>
                )}
                {exercise && hintsShown < exercise.hints.length && (
                  <button
                    onClick={() => setHintsShown((h) => h + 1)}
                    className="w-full py-2 rounded-lg bg-bg-primary hover:bg-bg-secondary text-text-secondary text-sm transition-colors"
                  >
                    İpucu Göster
                  </button>
                )}
              </div>
            )}

            {/* Continue button when exercise completed */}
            {exerciseCompleted && (
              <button
                onClick={() => {
                  if (currentLesson.next_lesson) {
                    loadLesson(currentLesson.next_lesson);
                  } else {
                    setView('home');
                  }
                }}
                className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
              >
                {currentLesson.next_lesson ? 'Sonraki Ders →' : 'Seviyeyi Tamamla ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span>Seviye {currentLesson.level}</span>
          <span>•</span>
          <span>Modül {currentLesson.module}</span>
          <span>•</span>
          <span>Ders {currentLesson.lesson}</span>
        </div>
        <h2 className="text-2xl font-bold">{currentLesson.title}</h2>
        <p className="text-text-secondary">{currentLesson.description}</p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-1.5 bg-bg-card rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-right text-xs text-text-secondary mt-1">
          Adım {currentProgress} / {totalSteps}
        </div>
      </div>

      {/* Content */}
      <div className="bg-bg-card rounded-xl p-6 mb-6">
        {content.type === 'text' && (
          <div className="prose prose-invert max-w-none">
            <p className="text-lg leading-relaxed">{content.content}</p>
          </div>
        )}

        {content.type === 'board' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-80">
              <Board
                size={(content.size || 9) as BoardSize}
                board={createBoardFromStones(content.stones || [], content.size || 9)}
                highlights={content.highlights}
                showCoordinates={true}
              />
            </div>
            {content.annotation && (
              <p className="text-sm text-text-secondary text-center italic">{content.annotation}</p>
            )}
          </div>
        )}

        {content.type === 'animation' && (
          <AnimationPlayer steps={content.steps || []} boardSize={(content.size || 9) as BoardSize} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={prevStep}
          disabled={lessonStep === 0}
          className="px-6 py-2 rounded-lg bg-bg-card text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          ← Önceki
        </button>

        {isLastStep ? (
          hasRequiredExercise && !exerciseCompleted ? (
            <button
              onClick={() => setShowExercise(true)}
              className="px-6 py-2 rounded-lg bg-info hover:bg-info/80 text-white font-semibold transition-colors"
            >
              Alıştırmaya Geç ✏️
            </button>
          ) : currentLesson.next_lesson ? (
            <button
              onClick={() => loadLesson(currentLesson.next_lesson!)}
              className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
            >
              Sonraki Ders →
            </button>
          ) : (
            <button
              onClick={() => setView('home')}
              className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
            >
              Tamamla ✓
            </button>
          )
        ) : (
          <button
            onClick={nextStep}
            className="px-6 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
          >
            Sonraki →
          </button>
        )}
      </div>
    </div>
  );
}

function AnimationPlayer({
  steps,
  boardSize: size,
}: {
  steps: { stones: { x: number; y: number; color: string }[]; captured?: { x: number; y: number }[]; text: string }[];
  boardSize: BoardSize;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const step = steps[currentStepIndex];
  const boardSize = size;

  const board = createBoardFromStones(
    step.stones.map((s) => ({ ...s, color: s.color as 'black' | 'white' })),
    boardSize
  );

  if (step.captured) {
    for (const cap of step.captured) {
      if (board[cap.y] && board[cap.y][cap.x] !== undefined) {
        board[cap.y][cap.x] = null;
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-72">
        <Board size={boardSize} board={board} showCoordinates={true} />
      </div>
      <p className="text-center text-sm">{step.text}</p>
      <div className="flex gap-2">
        <button
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
          className="px-4 py-1 rounded bg-bg-primary text-text-secondary disabled:opacity-30"
        >
          ◀
        </button>
        <span className="px-4 py-1 text-text-secondary">
          {currentStepIndex + 1}/{steps.length}
        </span>
        <button
          onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex === steps.length - 1}
          className="px-4 py-1 rounded bg-bg-primary text-text-secondary disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </div>
  );
}

function createBoardFromStones(
  stones: { x: number; y: number; color: string }[],
  size: number
): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }

  return board;
}
