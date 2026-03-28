import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog';
import { LEVELS } from '../../data/curriculum';
import { getAdaptiveDifficulty, getTypeDisplayName, type DifficultyRecommendation } from '../../utils/adaptiveDifficulty';
import { getSRSStats } from '../../utils/srs';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseCard } from './ExerciseCard';
import type { ExerciseProgressSummary } from '../../utils/progressDb';

interface ExerciseCatalogEntry {
  id: string;
  level: number;
  module: number;
  title: string;
  type: string;
  difficulty: number;
}

interface GroupedExercises {
  level: number;
  levelTitle: string;
  modules: {
    moduleId: number;
    moduleTitle: string;
    exercises: ExerciseCatalogEntry[];
  }[];
}

export function ExerciseCatalog() {
  const { loadExercise } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [recommendation, setRecommendation] = useState<DifficultyRecommendation | null>(null);
  const [srsStats, setSrsStats] = useState({ total_cards: 0, due_today: 0, learned: 0, learning: 0, lapsed: 0 });
  const [allProgress, setAllProgress] = useState<Map<string, ExerciseProgressSummary>>(new Map());
  const [lastAttemptedId, setLastAttemptedId] = useState<string | null>(null);

  useEffect(() => {
    getAdaptiveDifficulty(2).then(setRecommendation).catch(() => {});
    getSRSStats().then(setSrsStats).catch(() => {});
    import('../../utils/progressDb').then(({ getAllExerciseProgress, getLastAttemptedExercise }) => {
      getAllExerciseProgress().then(setAllProgress).catch(() => {});
      getLastAttemptedExercise().then(setLastAttemptedId).catch(() => {});
    });
  }, []);

  const filteredCatalog = useMemo(() => {
    let items: ExerciseCatalogEntry[] = EXERCISE_CATALOG;
    if (filterLevel !== null) items = items.filter((e) => e.level === filterLevel);
    if (filterType !== null) items = items.filter((e) => e.type === filterType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          getTypeDisplayName(e.type).toLowerCase().includes(q)
      );
    }
    return items;
  }, [filterLevel, filterType, searchQuery]);

  const groupedExercises = useMemo<GroupedExercises[]>(() => {
    const levelMap = new Map<number, Map<number, ExerciseCatalogEntry[]>>();

    for (const ex of filteredCatalog) {
      if (!levelMap.has(ex.level)) levelMap.set(ex.level, new Map());
      const moduleMap = levelMap.get(ex.level)!;
      if (!moduleMap.has(ex.module)) moduleMap.set(ex.module, []);
      moduleMap.get(ex.module)!.push(ex);
    }

    const result: GroupedExercises[] = [];
    for (const [level, moduleMap] of levelMap) {
      const levelDef = LEVELS.find((l) => l.id === level);
      const modules = [];
      for (const [moduleId, exercises] of moduleMap) {
        const moduleDef = levelDef?.modules.find((m) => m.id === moduleId);
        modules.push({
          moduleId,
          moduleTitle: moduleDef?.title || `Modül ${moduleId}`,
          exercises,
        });
      }
      result.push({
        level,
        levelTitle: levelDef?.title || `Seviye ${level}`,
        modules,
      });
    }

    return result.sort((a, b) => a.level - b.level);
  }, [filteredCatalog]);

  // Auto-expand groups when filters are active or search is empty
  useEffect(() => {
    if (searchQuery || filterLevel !== null || filterType !== null) {
      const keys = new Set<string>();
      for (const g of groupedExercises) {
        for (const m of g.modules) {
          keys.add(`${g.level}-${m.moduleId}`);
        }
      }
      setExpandedGroups(keys);
    }
  }, [searchQuery, filterLevel, filterType, groupedExercises]);

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleResume = useCallback(() => {
    if (lastAttemptedId) loadExercise(lastAttemptedId);
  }, [lastAttemptedId, loadExercise]);

  const handleRandom = useCallback(() => {
    const items = filteredCatalog.length > 0 ? filteredCatalog : EXERCISE_CATALOG;
    const randomEx = items[Math.floor(Math.random() * items.length)];
    if (randomEx) loadExercise(randomEx.id);
  }, [filteredCatalog, loadExercise]);

  const recommendedExercises = useMemo(() => {
    if (!recommendation || recommendation.focusTypes.length === 0) return [];
    return EXERCISE_CATALOG.filter((ex) =>
      recommendation.focusTypes.includes(ex.type)
    ).slice(0, 3);
  }, [recommendation]);

  const getGroupProgress = useCallback(
    (exercises: ExerciseCatalogEntry[]) => {
      let completed = 0;
      for (const ex of exercises) {
        const p = allProgress.get(ex.id);
        if (p?.correct) completed++;
      }
      return { completed, total: exercises.length };
    },
    [allProgress]
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Alıştırmalar</h2>
        <p className="text-text-secondary">
          Seviye ve türe göre filtreleyerek çalışın ({EXERCISE_CATALOG.length} alıştırma)
        </p>
      </div>

      {/* SRS Review Mode */}
      {srsStats.due_today > 0 && (
        <div className="glass rounded-2xl p-6 border border-info/20 bg-info/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-bold">Bugünün Tekrarı ({srsStats.due_today})</h3>
                <p className="text-sm text-text-secondary">
                  Aralıklı tekrar kartlarınız hazır
                </p>
              </div>
            </div>
            <button
              onClick={() => useAppStore.getState().setView('srs-review')}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              Tekrara Başla
            </button>
          </div>
        </div>
      )}

      {/* Quick start */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {lastAttemptedId && (
          <button
            onClick={handleResume}
            className="glass rounded-2xl p-5 text-left border border-glass-border hover:border-accent/30 card-hover transition-all group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏯</span>
              <div>
                <h4 className="font-bold group-hover:text-accent transition-colors">
                  Kaldığın Yerden Devam Et
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Son çalıştığın alıştırmaya dön
                </p>
              </div>
            </div>
          </button>
        )}
        <button
          onClick={handleRandom}
          className="glass rounded-2xl p-5 text-left border border-glass-border hover:border-accent/30 card-hover transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <h4 className="font-bold group-hover:text-accent transition-colors">
                Rastgele Alıştırma
              </h4>
              <p className="text-xs text-text-secondary mt-0.5">
                Şansını dene, rastgele bir alıştırma seç
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Recommended section */}
      {recommendedExercises.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-accent/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="text-lg font-bold">Sizin İçin Önerilen</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">{recommendation?.reason}</p>
          {recommendation && recommendation.focusTypes.length > 0 && (
            <p className="text-sm text-text-secondary mb-4">
              Odaklanmanız gereken türler:{' '}
              <span className="text-accent font-medium">
                {recommendation.focusTypes.map((t) => getTypeDisplayName(t)).join(', ')}
              </span>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendedExercises.map((ex) => (
              <button
                key={ex.id}
                onClick={() => loadExercise(ex.id)}
                className="bg-accent/5 rounded-xl p-4 text-left border border-accent/20 hover:border-accent/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md border bg-accent/10 text-accent border-accent/20">
                    {getTypeDisplayName(ex.type)}
                  </span>
                  <span className="text-xs text-text-secondary">Lv.{ex.level}</span>
                </div>
                <h4 className="font-semibold text-sm group-hover:text-accent transition-colors">
                  {ex.title}
                </h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <ExerciseFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterLevel={filterLevel}
        onFilterLevelChange={setFilterLevel}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
      />

      {/* Grouped catalog */}
      {groupedExercises.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-lg mb-1">Sonuç bulunamadı</p>
          <p className="text-sm">Arama veya filtre kriterlerinizi değiştirin</p>
        </div>
      )}

      <div className="space-y-4">
        {groupedExercises.map((group) => (
          <div key={group.level} className="space-y-3">
            {group.modules.map((mod) => {
              const groupKey = `${group.level}-${mod.moduleId}`;
              const isExpanded = expandedGroups.has(groupKey);
              const { completed, total } = getGroupProgress(mod.exercises);

              return (
                <div key={groupKey} className="glass rounded-2xl border border-glass-border overflow-hidden">
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                      <div className="text-left">
                        <span className="text-xs text-text-secondary">
                          Seviye {group.level} — {group.levelTitle}
                        </span>
                        <h3 className="font-bold">
                          {mod.moduleTitle}
                          <span className="text-sm font-normal text-text-secondary ml-2">
                            ({completed}/{total})
                          </span>
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {total > 0 && (
                        <div className="w-24 h-1.5 rounded-full bg-glass-border overflow-hidden">
                          <div
                            className="h-full rounded-full bg-success transition-all"
                            style={{ width: `${(completed / total) * 100}%` }}
                          />
                        </div>
                      )}
                      <span className="text-xs text-text-secondary">{total} alıştırma</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {mod.exercises.map((ex) => (
                          <ExerciseCard
                            key={ex.id}
                            exercise={ex}
                            progress={allProgress.get(ex.id)}
                            onClick={loadExercise}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
