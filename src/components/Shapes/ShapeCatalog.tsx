import { useState } from 'react';
import { SHAPES, getShapesByCategory } from '../../data/shapes';
import type { GoShape } from '../../types';
import { ShapeCard } from './ShapeCard';
import { ShapeDetail } from './ShapeDetail';

const CATEGORIES: { id: GoShape['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'Tümü' },
  { id: 'connection', label: 'Bağlantı' },
  { id: 'eye_shape', label: 'Göz Şekli' },
  { id: 'attack', label: 'Saldırı' },
  { id: 'defense', label: 'Savunma' },
  { id: 'territory', label: 'Toprak' },
  { id: 'efficiency', label: 'Verimlilik' },
];

const LEVELS = [
  { id: 0, label: 'Tümü' },
  { id: 1, label: 'Seviye 1' },
  { id: 2, label: 'Seviye 2' },
  { id: 3, label: 'Seviye 3' },
  { id: 4, label: 'Seviye 4+' },
];

export function ShapeCatalog() {
  const [category, setCategory] = useState<GoShape['category'] | 'all'>('all');
  const [level, setLevel] = useState(0);
  const [selectedShape, setSelectedShape] = useState<GoShape | null>(null);

  const filteredShapes = (() => {
    let shapes = category === 'all' ? SHAPES : getShapesByCategory(category);
    if (level > 0) {
      if (level === 4) {
        shapes = shapes.filter(s => s.level >= 4);
      } else {
        shapes = shapes.filter(s => s.level === level);
      }
    }
    return shapes;
  })();

  if (selectedShape) {
    return <ShapeDetail shape={selectedShape} onBack={() => setSelectedShape(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Şekil Kataloğu</h2>
        <p className="text-text-secondary">Go'daki temel şekil kalıplarını keşfedin</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category === cat.id ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {LEVELS.map(l => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${level === l.id ? 'bg-accent/20 text-accent' : 'glass text-text-secondary hover:text-text-primary'}`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredShapes.map(shape => (
          <ShapeCard key={shape.id} shape={shape} onClick={() => setSelectedShape(shape)} />
        ))}
      </div>

      {filteredShapes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-secondary">Bu filtrede şekil bulunamadı.</p>
        </div>
      )}
    </div>
  );
}
