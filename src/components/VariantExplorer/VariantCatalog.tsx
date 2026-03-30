import { useState, useEffect, useMemo } from 'react';
import { getAllVariations, getVariationsByCategory, CATEGORY_LABELS } from '../../data/variations';
import { useAppStore } from '../../stores/appStore';
import { getAllVariantProgress } from '../../utils/progressDb';
import type { VariationPosition, VariationCategory } from '../../types';

interface VariantCatalogProps {
  onSelectPosition: (positionId: string) => void;
}

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as VariationCategory[];

export function VariantCatalog({ onSelectPosition }: VariantCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<VariationCategory | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [progressMap, setProgressMap] = useState<Map<string, { explored: Set<string>; quizCorrect: boolean }>>(new Map());
  const catalogLoaded = useAppStore((state) => state.catalogLoaded);
  const loadCatalogs = useAppStore((state) => state.loadCatalogs);

  useEffect(() => {
    if (!catalogLoaded) loadCatalogs();
  }, []);

  useEffect(() => {
    getAllVariantProgress().then(records => {
      const map = new Map<string, { explored: Set<string>; quizCorrect: boolean }>();
      for (const r of records) {
        const existing = map.get(r.position_id) ?? { explored: new Set<string>(), quizCorrect: false };
        if (r.explored && r.variation_id !== '__quiz__') {
          existing.explored.add(r.variation_id);
        }
        if (r.quiz_completed && r.quiz_correct) {
          existing.quizCorrect = true;
        }
        map.set(r.position_id, existing);
      }
      setProgressMap(map);
    }).catch(() => {});
  }, [catalogLoaded]);

  const filteredPositions = useMemo(() => {
    let positions: VariationPosition[];
    if (selectedCategory === 'all') {
      positions = getAllVariations();
    } else {
      positions = getVariationsByCategory()[selectedCategory] ?? [];
    }
    if (selectedLevel !== 'all') {
      positions = positions.filter(p => p.level === selectedLevel);
    }
    return positions;
  }, [selectedCategory, selectedLevel, catalogLoaded]);

  const levels = useMemo(() => {
    const lvls = new Set<number>(getAllVariations().map(p => p.level));
    return Array.from(lvls).sort((a, b) => a - b);
  }, [catalogLoaded]);

  if (!catalogLoaded) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Varyant Kataloğu</h2>
          <p className="text-text-secondary">Yükleniyor...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-glass-border animate-pulse">
              <div className="h-4 bg-glass-border rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-glass-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Varyant Kataloğu</h2>
        <p className="text-text-secondary">Kategorilere göre varyant pozisyonlarını keşfedin.</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            selectedCategory === 'all' ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          Tümü ({getAllVariations().length})
        </button>
        {ALL_CATEGORIES.map(cat => {
          const count = getVariationsByCategory()[cat]?.length ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'
              }`}
            >
              {CATEGORY_LABELS[cat]} ({count})
            </button>
          );
        })}
      </div>

      {/* Level filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setSelectedLevel('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            selectedLevel === 'all' ? 'bg-info/20 text-info' : 'glass text-text-secondary hover:text-text-primary'
          }`}
        >
          Tüm Seviyeler
        </button>
        {levels.map(lvl => (
          <button
            key={lvl}
            onClick={() => setSelectedLevel(lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              selectedLevel === lvl ? 'bg-info/20 text-info' : 'glass text-text-secondary hover:text-text-primary'
            }`}
          >
            Seviye {lvl}
          </button>
        ))}
      </div>

      {/* Position cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPositions.map(pos => {
          const progress = progressMap.get(pos.id);
          const exploredCount = progress?.explored.size ?? 0;
          const totalVariations = pos.variations.length;
          const quizDone = progress?.quizCorrect ?? false;

          return (
            <button
              key={pos.id}
              onClick={() => onSelectPosition(pos.id)}
              className="glass rounded-2xl p-5 text-left card-hover border border-glass-border transition-all hover:border-accent/30"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-accent/70">
                    {pos.category ? CATEGORY_LABELS[pos.category] : 'Köşe'}
                  </span>
                  <span className="text-xs text-text-secondary ml-2">Seviye {pos.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  {quizDone && (
                    <span className="text-xs bg-success/15 text-success px-2 py-0.5 rounded-full font-medium">
                      Test
                    </span>
                  )}
                  <span className="text-xs bg-accent/15 text-accent px-2 py-0.5 rounded-full font-medium">
                    {exploredCount}/{totalVariations}
                  </span>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-1 text-text-primary">{pos.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">{pos.description}</p>

              <div className="mt-4 flex items-center gap-2 text-text-secondary text-xs">
                <span>{pos.variations.length} varyant</span>
                <span>·</span>
                <span>{pos.board_size}x{pos.board_size} tahta</span>
                {pos.quiz && (
                  <>
                    <span>·</span>
                    <span className="text-accent">Quiz var</span>
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {filteredPositions.length === 0 && (
        <div className="text-center py-12 text-text-secondary">
          <p>Bu filtrede varyant bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
