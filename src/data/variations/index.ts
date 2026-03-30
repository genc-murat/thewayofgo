import type { VariationPosition, VariationCategory } from '../../types';

const variationModules = import.meta.glob('./*.json') as Record<string, () => Promise<{ default?: VariationPosition[] } & VariationPosition[]>>;

let _cache: VariationPosition[] | null = null;
let _byCategoryCache: Record<VariationCategory, VariationPosition[]> | null = null;

export function getAllVariations(): VariationPosition[] {
  return _cache ?? [];
}

export function getVariationsByCategory(): Record<VariationCategory, VariationPosition[]> {
  return _byCategoryCache ?? {} as Record<VariationCategory, VariationPosition[]>;
}

export async function loadAllVariations(): Promise<VariationPosition[]> {
  if (_cache) return _cache;

  const modules = await Promise.all(
    Object.values(variationModules).map(async (loader) => {
      const mod = await loader();
      const data = mod.default || mod;
      return Array.isArray(data) ? data : [data];
    })
  );

  _cache = modules.flat().sort((a, b) => a.level - b.level);

  _byCategoryCache = _cache.reduce((acc, v) => {
    const cat = v.category || 'corner';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {} as Record<VariationCategory, VariationPosition[]>);

  return _cache;
}

export const CATEGORY_LABELS: Record<VariationCategory, string> = {
  corner: 'Köşe',
  life_death: 'Yaşam-Ölüm',
  capture: 'Esir Alma',
  fuseki: 'Açılış',
  endgame: 'Oyun Sonu',
  tesuji: 'Tesuji',
  joseki: 'Joseki',
};
