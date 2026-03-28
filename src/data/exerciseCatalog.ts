interface ExerciseCatalogEntry {
  id: string;
  level: number;
  module: number;
  title: string;
  type: string;
  difficulty: number;
}

const exerciseModules = import.meta.glob('./exercises/*.json', { eager: true }) as Record<string, { default?: ExerciseCatalogEntry } & ExerciseCatalogEntry>;

export const EXERCISE_CATALOG: ExerciseCatalogEntry[] = Object.entries(exerciseModules).map(([_path, mod]) => {
  const data = mod.default || mod;
  return {
    id: data.id,
    level: data.level,
    module: data.module,
    title: data.title,
    type: data.type,
    difficulty: data.difficulty,
  };
}).sort((a, b) => {
  if (a.level !== b.level) return a.level - b.level;
  if (a.module !== b.module) return a.module - b.module;
  return a.id.localeCompare(b.id);
});
