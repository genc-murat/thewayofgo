import { useCallback } from 'react';
import { getTypeDisplayName } from '../../utils/adaptiveDifficulty';
import type { ExerciseProgressSummary } from '../../utils/progressDb';
import { TYPE_COLORS } from './ExerciseFilters';

interface ExerciseCatalogEntry {
  id: string;
  level: number;
  module: number;
  title: string;
  type: string;
  difficulty: number;
}

interface ExerciseCardProps {
  exercise: ExerciseCatalogEntry;
  progress: ExerciseProgressSummary | undefined;
  onClick: (id: string) => void;
}

export function ExerciseCard({ exercise, progress, onClick }: ExerciseCardProps) {
  const handleClick = useCallback(() => {
    onClick(exercise.id);
  }, [exercise.id, onClick]);

  const statusIcon = !progress
    ? null
    : progress.correct
    ? '✓'
    : progress.attempts > 0
    ? '✗'
    : null;

  const statusColor = progress?.correct
    ? 'text-success'
    : progress && progress.attempts > 0
    ? 'text-error'
    : '';

  return (
    <button
      onClick={handleClick}
      className="glass rounded-2xl p-5 text-left card-hover border border-glass-border hover:border-accent/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
            TYPE_COLORS[exercise.type] || 'glass text-text-secondary'
          }`}
        >
          {getTypeDisplayName(exercise.type)}
        </span>
        <div className="flex items-center gap-2">
          {statusIcon && (
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${statusColor} ${
                progress?.correct ? 'bg-success/15' : 'bg-error/15'
              }`}
            >
              {statusIcon}
            </span>
          )}
          <span className="text-xs text-text-secondary">Lv.{exercise.level}</span>
        </div>
      </div>

      <h4 className="font-bold mb-2 group-hover:text-accent transition-colors">
        {exercise.title}
      </h4>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-accent">
          {'★'.repeat(Math.max(0, Math.min(5, exercise.difficulty || 0)))}
          {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, exercise.difficulty || 0))))}
        </div>

        {progress && progress.attempts > 0 && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{progress.attempts} deneme</span>
            {progress.last_attempt && (
              <span>
                {new Date(progress.last_attempt).toLocaleDateString('tr-TR', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
