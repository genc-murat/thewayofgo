import { useState, useMemo } from 'react';
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog';
import type { StepResult } from '../../types';
import type { ExerciseAttempt } from '../../utils/progressDb';

interface ExercisePlayerSidebarProps {
  exerciseId: string;
  exerciseType: string;
  exerciseAttempts: number;
  exerciseResult: { correct: boolean; explanation: string; best_move: [number, number] | null } | null;
  isMultiStep: boolean;
  stepResults: StepResult[];
  allStepsCompleted: boolean;
  lastStepResult: StepResult | null;
  hints: string[];
  exerciseHistory: ExerciseAttempt[];
  onRetry: () => void;
  onNextExercise: () => void;
  onAdvanceStep: () => void;
}

export function ExercisePlayerSidebar({
  exerciseId,
  exerciseType,
  exerciseAttempts,
  exerciseResult,
  isMultiStep,
  allStepsCompleted,
  lastStepResult,
  hints,
  exerciseHistory,
  onRetry,
  onNextExercise,
  onAdvanceStep,
}: ExercisePlayerSidebarProps) {
  const [revealedHints, setRevealedHints] = useState(1);

  const isFinished = exerciseResult
    || (isMultiStep && (allStepsCompleted || (lastStepResult && !lastStepResult.correct)));

  const similarExercises = useMemo(() => {
    return EXERCISE_CATALOG
      .filter((e) => e.type === exerciseType && e.id !== exerciseId)
      .slice(0, 3);
  }, [exerciseType, exerciseId]);

  return (
    <div className="lg:w-72 space-y-4">
      {/* Multi-step step result */}
      {isMultiStep && lastStepResult && (
        <div
          className={`animate-scale-in rounded-2xl p-5 border ${
            lastStepResult.correct
              ? 'bg-success/10 border-success/30 glow-success'
              : 'bg-error/10 border-error/30 glow-error'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                lastStepResult.correct
                  ? 'bg-success/20 text-success'
                  : 'bg-error/20 text-error'
              }`}
            >
              {lastStepResult.correct ? '✓' : '✗'}
            </div>
            <span className="font-bold">
              {lastStepResult.correct ? 'Doğru!' : 'Yanlış'}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{lastStepResult.explanation}</p>
          {lastStepResult.correct && !allStepsCompleted && (
            <button
              onClick={onAdvanceStep}
              className="mt-3 w-full btn-primary py-2 rounded-xl text-sm"
            >
              Sonraki Adım →
            </button>
          )}
        </div>
      )}

      {/* Single-step result */}
      {!isMultiStep && exerciseResult && (
        <div
          className={`animate-scale-in rounded-2xl p-5 border ${
            exerciseResult.correct
              ? 'bg-success/10 border-success/30 glow-success'
              : 'bg-error/10 border-error/30 glow-error'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${
                exerciseResult.correct
                  ? 'bg-success/20 text-success'
                  : 'bg-error/20 text-error'
              }`}
            >
              {exerciseResult.correct ? '✓' : '✗'}
            </div>
            <span className="font-bold">
              {exerciseResult.correct ? 'Doğru!' : 'Yanlış'}
            </span>
          </div>
          <p className="text-sm text-text-secondary">{exerciseResult.explanation}</p>
        </div>
      )}

      {/* All steps completed */}
      {isMultiStep && allStepsCompleted && (
        <div className="animate-scale-in rounded-2xl p-5 border bg-success/10 border-success/30 glow-success">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-success/20 text-success">
              ✓
            </div>
            <span className="font-bold">Tüm Adımlar Tamamlandı!</span>
          </div>
          <p className="text-sm text-text-secondary">
            Tüm adımları başarıyla çözdünüz.
          </p>
        </div>
      )}

      {/* Attempt count */}
      <div className="glass rounded-2xl p-5">
        <div className="text-sm text-text-secondary mb-1">Deneme Sayısı</div>
        <div className="text-3xl font-bold">{exerciseAttempts}</div>
      </div>

      {/* Progressive hints */}
      {hints.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-medium mb-3">İpuçları</div>
          <div className="space-y-2.5">
            {hints.map((hint, i) => {
              if (i < revealedHints) {
                return (
                  <p key={i} className="text-sm text-text-secondary animate-fade-in">
                    <span className="text-accent font-medium text-xs mr-1.5">İpucu {i + 1}:</span>
                    {hint}
                  </p>
                );
              }
              return (
                <button
                  key={i}
                  onClick={() => setRevealedHints(i + 1)}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-accent/70 hover:text-accent glass border border-glass-border hover:border-accent/30 transition-all"
                >
                  İpucu {i + 1}'i Göster
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Exercise history */}
      {exerciseHistory.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-medium mb-2">Geçmiş Denemeler</div>
          <div className="space-y-1.5">
            {exerciseHistory.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className={h.correct ? 'text-success' : 'text-error'}>
                  {h.correct ? '✓ Doğru' : '✗ Yanlış'}
                </span>
                <span className="text-text-secondary">
                  {h.last_attempt
                    ? new Date(h.last_attempt).toLocaleDateString('tr-TR')
                    : '-'}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-glass-border text-xs text-text-secondary">
            Toplam:{' '}
            {exerciseHistory.length > 0
              ? Math.round(
                  (exerciseHistory.filter((h) => h.correct).length /
                    exerciseHistory.length) *
                    100
                )
              : 0}
            % doğruluk
          </div>
        </div>
      )}

      {/* Similar exercises */}
      {similarExercises.length > 0 && isFinished && (
        <div className="glass rounded-2xl p-5">
          <div className="text-sm font-medium mb-2">Benzer Alıştırmalar</div>
          <div className="space-y-2">
            {similarExercises.map((ex) => (
              <div
                key={ex.id}
                className="flex items-center justify-between text-xs py-1"
              >
                <span className="text-text-primary truncate mr-2">{ex.title}</span>
                <span className="text-text-secondary shrink-0">Lv.{ex.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onNextExercise}
          className="flex-1 btn-ghost py-2.5 rounded-xl text-sm"
        >
          Sonraki →
        </button>
        {isFinished && (
          <button
            onClick={onRetry}
            className="flex-1 btn-primary py-2.5 rounded-xl text-sm"
          >
            Tekrar Dene
          </button>
        )}
      </div>
    </div>
  );
}
