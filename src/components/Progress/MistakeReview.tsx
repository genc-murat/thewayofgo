import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getMistakeExercises } from '../../utils/progressDb';
import { getTypeDisplayName } from '../../utils/adaptiveDifficulty';
import type { MistakeExercise } from '../../utils/progressDb';

export function MistakeReview() {
  const { loadExercise, setView } = useAppStore();
  const [mistakes, setMistakes] = useState<MistakeExercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMistakeExercises(20).then((data) => {
      setMistakes(data);
      setLoading(false);
    }).catch(err => {
      console.warn('[MistakeReview] Failed to load:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-bg-card rounded w-1/3" />
          <div className="h-3 bg-bg-card rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (mistakes.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold mb-2">Hata Tekrarı</h3>
        <p className="text-sm text-text-secondary">Henüz yanlış yaptığınız alıştırma yok. Harika!</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg">Hata Tekrarı</h3>
        <span className="text-sm text-text-secondary">{mistakes.length} alıştırma</span>
      </div>

      <div className="space-y-2">
        {mistakes.slice(0, 5).map((m) => (
          <button
            key={m.exercise_id}
            onClick={() => loadExercise(m.exercise_id)}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-bg-primary/40 border border-glass-border hover:border-accent/30 transition-all text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-error/15 flex items-center justify-center text-error text-sm font-bold">
              {m.attempts}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{m.exercise_id}</div>
              <div className="text-xs text-text-secondary">{getTypeDisplayName(m.exercise_type)}</div>
            </div>
            <span className="text-xs text-text-secondary">Tekrar Çöz →</span>
          </button>
        ))}
      </div>

      {mistakes.length > 5 && (
        <button
          onClick={() => setView('exercise')}
          className="mt-3 w-full text-center text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Tümünü Gör ({mistakes.length})
        </button>
      )}
    </div>
  );
}
