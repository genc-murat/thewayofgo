import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import type { LadderRung } from '../../types';

interface LadderRungProps {
  rung: LadderRung;
  index: number;
  totalStars: number; // total stars earned so far (for unlocking)
  isCurrent: boolean;
}

export function LadderRung({ rung, index, totalStars, isCurrent }: LadderRungProps) {
  const [showExerciseDetail, setShowExerciseDetail] = useState(false);
  const loadExercise = useAppStore((s) => s.loadExercise);
  const { exerciseAttempts, exerciseResult } = useAppStore();

  const isUnlocked = totalStars >= rung.stars_to_unlock;

  const handleClick = () => {
    if (!isUnlocked) return;
    setShowExerciseDetail(true);
  };

  const handleStartExercise = () => {
    setShowExerciseDetail(false);
    loadExercise(rung.exercise_id);
    // navigate to exercise view
    useAppStore.getState().setView('exercise');
  };

  return (
    <>
      <div
        onClick={handleClick}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${
          isCurrent
            ? 'bg-accent text-bg-primary ring-2 ring-accent/50'
            : isUnlocked
            ? 'bg-success/20 text-success border-success/30'
            : 'bg-bg-card/50 text-text-secondary border bg-bg-primary/50'
        }`}
      >
        {index + 1}
      </div>

      {showExerciseDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => {
          if (e.target === e.currentTarget) setShowExerciseDetail(false);
        }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative glass-strong rounded-3xl p-6 max-w-xl w-full max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowExerciseDetail(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
            >
              ✕
            </button>

            <div className="mb-4">
              <h3 className="text-lg font-bold text-text-primary">Alıştırma Önizleme</h3>
            </div>

            {/* We need to load exercise data to show details */}
            {/* For simplicity, we'll just show a button to start exercise */}
            <div className="text-center py-8">
              <p className="text-text-secondary">Bu basamağa başlamak için tıklayın.</p>
              <button
                onClick={handleStartExercise}
                className="btn-primary px-6 py-3 rounded-xl mt-4"
              >
                Alıştırmayı Başla
              </button>
              {exerciseAttempts > 0 && (
                <div className="mt-4 text-sm">
                  {exerciseResult ? (
                    exerciseResult.correct
                      ? <span className="text-success">Doğru!</span>
                      : <span className="text-error">Yanlış. Tekrar deneyin.</span>
                  ) : (
                    <span className="text-text-secondary">Deneme: {exerciseAttempts}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
