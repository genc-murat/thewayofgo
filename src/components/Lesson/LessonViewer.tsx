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
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    setExerciseCompleted(false);
    setShowExercise(false);
    setExercise(null);
    setExerciseResult(null);
    setHintsShown(0);
  }, [currentLesson?.id]);

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
      const matchedMove = exercise.correct_moves.find((m) => m.x === x && m.y === y);
      if (matchedMove) {
        setExerciseResult({ correct: matchedMove.is_correct, explanation: matchedMove.explanation });
        if (matchedMove.is_correct) setExerciseCompleted(true);
      } else {
        setExerciseResult({ correct: false, explanation: 'Bu hamle beklenen seçenekler arasında değil. Tekrar deneyin.' });
      }
    },
    [exercise, exerciseResult]
  );

  const handleNext = () => {
    setAnimDirection('forward');
    nextStep();
  };

  const handlePrev = () => {
    setAnimDirection('backward');
    prevStep();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!currentLesson || showExercise) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); handleNext(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  if (!currentLesson) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-bg-card flex items-center justify-center">
          <svg className="w-8 h-8 text-text-secondary" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>
        </div>
        <p className="text-text-secondary mb-4">Henüz bir ders seçilmedi.</p>
        <button onClick={() => setView('home')} className="text-accent hover:text-accent-hover font-medium">Ana sayfaya dön</button>
      </div>
    );
  }

  const content = currentLesson.content[lessonStep];
  const isLastStep = lessonStep === currentLesson.content.length - 1;
  const hasRequiredExercise = !!currentLesson.required_exercise;
  const totalSteps = currentLesson.content.length + (hasRequiredExercise ? 1 : 0);
  const currentProgress = showExercise ? currentLesson.content.length + 1 : lessonStep + 1;
  const progress = (currentProgress / totalSteps) * 100;

  if (showExercise && exercise) {
    const boardSize = exercise.board_size as BoardSize;
    const board = createBoardFromStones(exercise.initial_stones, boardSize);
    const highlights: Highlight[] = [];
    if (exerciseResult && !exerciseResult.correct) {
      const correctMove = exercise.correct_moves.find((m) => m.is_correct);
      if (correctMove) highlights.push({ x: correctMove.x, y: correctMove.y, type: 'good' });
    }

    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
            <span className="bg-accent/15 text-accent px-2.5 py-1 rounded-lg font-medium text-xs">Alıştırma</span>
            <span className="text-xs">Zorluk: {'★'.repeat(exercise.difficulty)}{'☆'.repeat(5 - exercise.difficulty)}</span>
          </div>
          <h2 className="text-2xl font-bold">{exercise.title}</h2>
          <p className="text-text-secondary mt-1">{exercise.description}</p>
        </div>

        <div className="mb-6">
          <div className="h-2 bg-bg-card/50 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-sm glass rounded-2xl p-4">
              <Board size={boardSize} board={board} highlights={highlights} onIntersectionClick={handleBoardClick} interactive={!exerciseCompleted} showCoordinates={true} />
            </div>
          </div>

          <div className="lg:w-80 space-y-4">
            {exerciseResult && (
              <div className={`animate-scale-in rounded-2xl p-5 border ${
                exerciseResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
              }`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                    exerciseResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                  }`}>
                    {exerciseResult.correct ? '✓' : '✗'}
                  </div>
                  <span className="font-bold text-lg">{exerciseResult.correct ? 'Doğru!' : 'Yanlış'}</span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{exerciseResult.explanation}</p>
                {!exerciseResult.correct && (
                  <button onClick={() => setExerciseResult(null)} className="mt-4 w-full py-2.5 rounded-xl bg-bg-primary hover:bg-bg-secondary text-sm font-medium transition-colors">
                    Tekrar Dene
                  </button>
                )}
              </div>
            )}

            {!exerciseCompleted && (
              <div className="glass rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">İpuçları</span>
                  <span className="text-xs text-text-secondary bg-bg-primary px-2 py-0.5 rounded-full">{hintsShown}/{exercise?.hints.length || 0}</span>
                </div>
                {hintsShown > 0 && exercise && (
                  <div className="space-y-2 mb-4">
                    {exercise.hints.slice(0, hintsShown).map((hint, i) => (
                      <div key={i} className="text-sm text-text-secondary bg-bg-primary rounded-xl p-3 animate-fade-in-up">
                        <span className="text-accent mr-1.5">💡</span>{hint}
                      </div>
                    ))}
                  </div>
                )}
                {exercise && hintsShown < exercise.hints.length && (
                  <button onClick={() => setHintsShown((h) => h + 1)} className="w-full py-2.5 rounded-xl bg-bg-primary hover:bg-bg-secondary text-text-secondary text-sm font-medium transition-colors">
                    İpucu Göster
                  </button>
                )}
              </div>
            )}

            {exerciseCompleted && (
              <button
                onClick={() => { if (currentLesson.next_lesson) loadLesson(currentLesson.next_lesson); else setView('home'); }}
                className="btn-primary w-full py-3.5 rounded-xl text-base"
              >
                {currentLesson.next_lesson ? 'Sonraki Ders →' : 'Seviyeyi Tamamla ✓'}
              </button>
            )}

            <button onClick={() => setView('home')} className="btn-ghost w-full py-2 text-sm">Ana Sayfaya Dön</button>
          </div>
        </div>
      </div>
    );
  }

  const contentType = content.type;

  return (
    <div className={`max-w-4xl mx-auto ${animDirection === 'forward' ? 'animate-fade-in-up' : 'animate-fade-in'}`}>
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => setView('home')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Müfredat
        </button>

        <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
          <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-md font-medium">Seviye {currentLesson.level}</span>
          <span className="opacity-40">•</span>
          <span>Modül {currentLesson.module}</span>
          <span className="opacity-40">•</span>
          <span>Ders {currentLesson.lesson}</span>
          <span className="opacity-40">•</span>
          <span>{currentLesson.duration_minutes} dk</span>
        </div>

        <h2 className="text-3xl font-bold mb-1">{currentLesson.title}</h2>
        <p className="text-text-secondary">{currentLesson.description}</p>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2 mb-6">
        {currentLesson.content.map((_, i) => (
          <div key={i} className={`step-dot ${i === lessonStep ? 'active' : i < lessonStep ? 'completed' : ''}`} />
        ))}
        {hasRequiredExercise && (
          <>
            <div className="w-px h-4 bg-glass-border mx-1" />
            <div className={`step-dot ${showExercise ? 'active' : ''}`} />
          </>
        )}
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="h-1.5 bg-bg-card/50 rounded-full overflow-hidden">
          <div className="h-full progress-bar-animated rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-text-secondary">
          <span>Adım {currentProgress} / {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      {/* Content */}
      <div className={`glass rounded-2xl p-8 mb-8 border ${
        contentType === 'text' ? 'border-glass-border' :
        contentType === 'board' ? 'border-blue-500/20' :
        'border-accent/20'
      }`}>
        {contentType === 'text' && (
          <div className="animate-fade-in">
            <p className="text-lg leading-relaxed text-text-primary/90">{content.content}</p>
          </div>
        )}

        {contentType === 'board' && (
          <div className="flex flex-col items-center gap-5 animate-fade-in">
            <div className="w-full max-w-xs">
              <Board size={(content.size || 9) as BoardSize} board={createBoardFromStones(content.stones || [], content.size || 9)} highlights={content.highlights} showCoordinates={true} />
            </div>
            {content.annotation && (
              <p className="text-sm text-text-secondary text-center italic bg-bg-primary/50 px-4 py-2 rounded-xl">{content.annotation}</p>
            )}
          </div>
        )}

        {contentType === 'animation' && (
          <AnimationPlayer steps={content.steps || []} boardSize={(content.size || 9) as BoardSize} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button onClick={handlePrev} disabled={lessonStep === 0} className="btn-ghost flex items-center gap-2 disabled:opacity-20 disabled:cursor-not-allowed px-4 py-2.5 rounded-xl">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Önceki
        </button>

        {isLastStep ? (
          hasRequiredExercise && !exerciseCompleted ? (
            <button onClick={() => setShowExercise(true)} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>
              Alıştırmaya Geç
            </button>
          ) : currentLesson.next_lesson ? (
            <button onClick={() => loadLesson(currentLesson.next_lesson!)} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl">
              Sonraki Ders
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </button>
          ) : (
            <button onClick={() => setView('home')} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl">
              Tamamla ✓
            </button>
          )
        ) : (
          <button onClick={handleNext} className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl">
            Sonraki
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
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
  const board = createBoardFromStones(step.stones.map((s) => ({ ...s, color: s.color as 'black' | 'white' })), size);

  if (step.captured) {
    for (const cap of step.captured) {
      if (board[cap.y] && board[cap.y][cap.x] !== undefined) {
        board[cap.y][cap.x] = null;
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 animate-fade-in">
      <div className="glass rounded-2xl p-4">
        <Board size={size} board={board} showCoordinates={true} />
      </div>

      <div className="text-center max-w-sm">
        <p className="text-text-primary font-medium">{step.text}</p>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
          disabled={currentStepIndex === 0}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
        </button>

        <div className="flex items-center gap-2">
          {steps.map((_, i) => (
            <button key={i} onClick={() => setCurrentStepIndex(i)} className={`step-dot cursor-pointer ${i === currentStepIndex ? 'active' : i < currentStepIndex ? 'completed' : ''}`} />
          ))}
        </div>

        <span className="text-xs text-text-secondary font-mono min-w-[40px] text-center">{currentStepIndex + 1}/{steps.length}</span>

        <button
          onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
          disabled={currentStepIndex === steps.length - 1}
          className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
        </button>
      </div>
    </div>
  );
}

function createBoardFromStones(stones: { x: number; y: number; color: string }[], size: number): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }
  return board;
}
