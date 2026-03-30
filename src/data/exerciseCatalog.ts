export interface ExerciseCatalogEntry {
  id: string;
  level: number;
  module: number;
  title: string;
  type: string;
  difficulty: number;
}

const exerciseModules = import.meta.glob('./exercises/*.json') as Record<string, () => Promise<{ default?: ExerciseCatalogEntry } & ExerciseCatalogEntry>>;

let _cache: ExerciseCatalogEntry[] | null = null;

export function getExerciseCatalog(): ExerciseCatalogEntry[] {
  return _cache ?? [];
}

export async function loadExerciseCatalog(): Promise<ExerciseCatalogEntry[]> {
  if (_cache) return _cache;

  const entries = await Promise.all(
    Object.values(exerciseModules).map(async (loader) => {
      const mod = await loader();
      const data = mod.default || mod;
      return {
        id: data.id,
        level: data.level,
        module: data.module,
        title: data.title,
        type: data.type,
        difficulty: data.difficulty,
      };
    })
  );

  _cache = entries.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    if (a.module !== b.module) return a.module - b.module;
    return a.id.localeCompare(b.id);
  });

  return _cache;
}
