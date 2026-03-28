import { useCallback, useMemo } from 'react';
import { getTypeDisplayName } from '../../utils/adaptiveDifficulty';
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog';

const TYPE_COLORS: Record<string, string> = {
  'place_correct': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'capture_stones': 'bg-red-500/15 text-red-400 border-red-500/20',
  'life_and_death': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'connect_groups': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'cut_groups': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'defend_group': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'territorial_control': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'endgame': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'opening': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'multi_step': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
};

export { TYPE_COLORS };

interface ExerciseFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterLevel: number | null;
  onFilterLevelChange: (level: number | null) => void;
  filterType: string | null;
  onFilterTypeChange: (type: string | null) => void;
}

export function ExerciseFilters({
  searchQuery,
  onSearchChange,
  filterLevel,
  onFilterLevelChange,
  filterType,
  onFilterTypeChange,
}: ExerciseFiltersProps) {
  const types = useMemo(
    () => [...new Set(EXERCISE_CATALOG.map((e) => e.type))],
    []
  );

  const activeFilterCount =
    (filterLevel !== null ? 1 : 0) + (filterType !== null ? 1 : 0) + (searchQuery ? 1 : 0);

  const clearFilters = useCallback(() => {
    onSearchChange('');
    onFilterLevelChange(null);
    onFilterTypeChange(null);
  }, [onSearchChange, onFilterLevelChange, onFilterTypeChange]);

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Alıştırma ara..."
          className="w-full glass rounded-xl pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary/60 border border-glass-border focus:border-accent/40 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Level + Type filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => onFilterLevelChange(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterLevel === null
              ? 'gradient-accent text-bg-primary'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          Tümü
        </button>
        {[1, 2, 3, 4, 5, 6].map((lvl) => (
          <button
            key={lvl}
            onClick={() => onFilterLevelChange(lvl === filterLevel ? null : lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterLevel === lvl
                ? 'gradient-accent text-bg-primary'
                : 'glass text-text-secondary hover:text-text-primary'
            }`}
          >
            Seviye {lvl}
          </button>
        ))}
        <span className="w-px h-6 bg-glass-border self-center mx-1" />
        <button
          onClick={() => onFilterTypeChange(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterType === null
              ? 'gradient-accent text-bg-primary'
              : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          Tüm Türler
        </button>
        {types.map((t) => (
          <button
            key={t}
            onClick={() => onFilterTypeChange(t === filterType ? null : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterType === t
                ? 'gradient-accent text-bg-primary'
                : 'glass text-text-secondary hover:text-text-primary'
            }`}
          >
            {getTypeDisplayName(t)}
          </button>
        ))}

        {activeFilterCount > 0 && (
          <>
            <span className="w-px h-6 bg-glass-border self-center mx-1" />
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-error/80 hover:text-error glass transition-all"
            >
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Temizle
              <span className="bg-error/15 text-error rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {activeFilterCount}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
