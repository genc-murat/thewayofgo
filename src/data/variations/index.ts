import type { VariationPosition, VariationCategory } from '../../types';

const variationModules = import.meta.glob('./*.json', { eager: true }) as Record<string, { default?: VariationPosition[] } & VariationPosition[]>;

export const ALL_VARIATIONS: VariationPosition[] = Object.entries(variationModules)
  .map(([_, mod]) => {
    const data = mod.default || mod;
    return Array.isArray(data) ? data : [data];
  })
  .flat()
  .sort((a, b) => a.level - b.level);

export const VARIATIONS_BY_CATEGORY = ALL_VARIATIONS.reduce((acc, v) => {
  const cat = v.category || 'corner';
  if (!acc[cat]) acc[cat] = [];
  acc[cat].push(v);
  return acc;
}, {} as Record<VariationCategory, VariationPosition[]>);

export const CATEGORY_LABELS: Record<VariationCategory, string> = {
  corner: 'Köşe',
  life_death: 'Yaşam-Ölüm',
  capture: 'Esir Alma',
  fuseki: 'Açılış',
  endgame: 'Oyun Sonu',
  tesuji: 'Tesuji',
  joseki: 'Joseki',
};
