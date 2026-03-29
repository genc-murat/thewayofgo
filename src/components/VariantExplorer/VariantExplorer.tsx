import { useState, useMemo } from 'react';
import { VariantBoard } from './VariantBoard';
import { VariantTree } from './VariantTree';
import { VariantComparison } from './VariantComparison';
import type { VariationPosition, BoardSize } from '../../types';
import { createBoardFromStones } from '../../utils/boardUtils';
import { Board } from '../Board';

const VARIATIONS_DATA: VariationPosition[] = [
  {
    id: 'v1-1',
    title: 'Köşe İstilası Varyantları',
    description: 'Bu pozisyonda farklı hamlelerin sonuçlarını keşfedin.',
    level: 2,
    board_size: 9,
    initial_stones: [
      { x: 2, y: 2, color: 'black' },
      { x: 6, y: 2, color: 'white' },
      { x: 6, y: 6, color: 'black' },
      { x: 2, y: 6, color: 'white' },
    ],
    variations: [
      {
        id: 'A',
        label: 'Doğru hamle',
        is_best: true,
        moves: [
          { x: 3, y: 2, color: 'black' },
          { x: 4, y: 2, color: 'white' },
          { x: 2, y: 3, color: 'black' },
        ],
        result_description: 'Siyah köşe kontrolünü alır, güçlü toprak oluşturur.',
        evaluation: 'good',
      },
      {
        id: 'B',
        label: 'Yanlış hamle',
        is_best: false,
        moves: [
          { x: 5, y: 5, color: 'black' },
          { x: 3, y: 3, color: 'white' },
        ],
        result_description: 'Siyah köşeyi beyaza bırakır, zayıf pozisyona düşer.',
        evaluation: 'bad',
      },
    ],
  },
  {
    id: 'v1-2',
    title: 'Göz Yaşı',
    description: 'Yaşam-ölüm pozisyonu. Doğru sıralama ile göz oluşturulabilir.',
    level: 3,
    board_size: 9,
    initial_stones: [
      { x: 3, y: 3, color: 'black' }, { x: 4, y: 3, color: 'black' }, { x: 5, y: 3, color: 'black' },
      { x: 3, y: 4, color: 'black' }, { x: 5, y: 4, color: 'black' },
      { x: 3, y: 5, color: 'black' }, { x: 4, y: 5, color: 'black' }, { x: 5, y: 5, color: 'black' },
    ],
    variations: [
      {
        id: 'A',
        label: 'İlk göz',
        is_best: true,
        moves: [{ x: 4, y: 4, color: 'black' }],
        result_description: 'Siyah iki göz oluşturur, grup canlı kalır.',
        evaluation: 'good',
      },
      {
        id: 'B',
        label: 'Yanlış yönlendirme',
        is_best: false,
        moves: [{ x: 6, y: 4, color: 'black' }],
        result_description: 'Siyah göz yapılmaz, beyaz sızabilir.',
        evaluation: 'bad',
      },
      {
        id: 'C',
        label: 'Alternatif',
        is_best: false,
        moves: [{ x: 4, y: 4, color: 'black' }, { x: 2, y: 4, color: 'white' }],
        result_description: 'Siyah göz yaratır ama beyaz渗透 edebilir.',
        evaluation: 'neutral',
      },
    ],
  },
  {
    id: 'v2-1',
    title: 'Merdiven Örneği',
    description: 'Tek taşı esir almak için doğru yöntem.',
    level: 2,
    board_size: 9,
    initial_stones: [
      { x: 2, y: 2, color: 'black' },
      { x: 3, y: 3, color: 'white' },
    ],
    variations: [
      {
        id: 'A',
        label: 'Merdiven',
        is_best: true,
        moves: [
          { x: 2, y: 3, color: 'black' },
          { x: 4, y: 4, color: 'white' },
          { x: 4, y: 3, color: 'black' },
          { x: 5, y: 5, color: 'white' },
          { x: 5, y: 3, color: 'black' },
          { x: 6, y: 6, color: 'white' },
          { x: 6, y: 3, color: 'black' },
        ],
        result_description: 'Siyah beyaz taşları kenara doğru iter, merdiven tekniğiyle esir alır.',
        evaluation: 'good',
      },
      {
        id: 'B',
        label: 'Basmak',
        is_best: false,
        moves: [
          { x: 2, y: 3, color: 'black' },
          { x: 3, y: 4, color: 'white' },
        ],
        result_description: 'Siyah ilk basamakta逗bir hamle yapar, beyaz kaçar.',
        evaluation: 'bad',
      },
    ],
  },
  {
    id: 'v2-2',
    title: 'Ağ Tekniği',
    description: 'Merdiven yerine ağ kullanarak esir alma.',
    level: 3,
    board_size: 9,
    initial_stones: [
      { x: 3, y: 3, color: 'white' },
      { x: 2, y: 2, color: 'black' },
      { x: 4, y: 2, color: 'black' },
      { x: 1, y: 4, color: 'black' },
    ],
    variations: [
      {
        id: 'A',
        label: 'Ağ tamamlama',
        is_best: true,
        moves: [
          { x: 4, y: 4, color: 'black' },
          { x: 3, y: 5, color: 'white' },
          { x: 2, y: 4, color: 'black' },
        ],
        result_description: 'Siyah beyaz taşı完全ambique eder, saldırı başarılı.',
        evaluation: 'good',
      },
      {
        id: 'B',
        label: 'Direkt接触',
        is_best: false,
        moves: [
          { x: 3, y: 2, color: 'black' },
        ],
        result_description: 'Siyah beyazı接触 ettirir ama briquette edebilir.',
        evaluation: 'neutral',
      },
    ],
  },
  {
    id: 'v3-1',
    title: 'Fuseki Geçiş Varyantları',
    description: 'Tahtanın何处ינת noktalarında不同 hamle sonuçları.',
    level: 3,
    board_size: 9,
    initial_stones: [
      { x: 2, y: 2, color: 'black' },
      { x: 6, y: 6, color: 'white' },
    ],
    variations: [
      {
        id: 'A',
        label: 'Moyo축ak',
        is_best: true,
        moves: [
          { x: 4, y: 4, color: 'black' },
          { x: 4, y: 2, color: 'white' },
          { x: 5, y: 3, color: 'black' },
        ],
        result_description: 'Siyah merkeze占据 ederek güçlüꇗ 위ुseremedilik alanı oluşturur.',
        evaluation: 'good',
      },
      {
        id: 'B',
        label: 'İkinci keşe',
        is_best: false,
        moves: [
          { x: 2, y: 6, color: 'black' },
          { x: 6, y: 2, color: 'white' },
        ],
        result_description: 'Siyah另一种 köşe bağlant试图ler ama الرغم.clearlyتر dağınık kalır.',
        evaluation: 'neutral',
      },
    ],
  },
];

export function VariantExplorer() {
  const [selectedPositionId, setSelectedPositionId] = useState(VARIATIONS_DATA[0]?.id ?? '');
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  const selectedPosition = useMemo(
    () => VARIATIONS_DATA.find(p => p.id === selectedPositionId) ?? null,
    [selectedPositionId]
  );

  const selectedVariation = useMemo(
    () => selectedPosition?.variations.find(v => v.id === selectedVariationId) ?? null,
    [selectedPosition, selectedVariationId]
  );

  if (!selectedPosition) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Varyant pozisyonu bulunamadı.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Varyant Deneyimi</h2>
        <p className="text-text-secondary">Bir pozisyonda farklı hamleleri deneyip sonuçları karşılaştırın.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {VARIATIONS_DATA.map(pos => (
          <button
            key={pos.id}
            onClick={() => { setSelectedPositionId(pos.id); setSelectedVariationId(null); setShowComparison(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPositionId === pos.id ? 'bg-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'
            }`}
          >
            {pos.title}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          <div className="glass rounded-2xl p-6">
            <Board
              size={selectedPosition.board_size as BoardSize}
              board={createBoardFromStones(selectedPosition.initial_stones, selectedPosition.board_size)}
              showCoordinates={true}
            />
          </div>

          {selectedVariation && (
            <VariantBoard position={selectedPosition} variation={selectedVariation} />
          )}
        </div>

        <div className="flex-1 space-y-6">
          <div className="glass rounded-2xl p-6 border border-glass-border">
            <h3 className="text-xl font-bold mb-1">{selectedPosition.title}</h3>
            <p className="text-sm text-text-secondary mb-4">{selectedPosition.description}</p>

            {selectedVariation ? (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-bold text-lg">{selectedVariation.id}</span>
                  <span className="text-sm text-text-secondary">— {selectedVariation.label}</span>
                  {selectedVariation.is_best && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full font-medium">En İyi</span>
                  )}
                </div>
                <p className="text-text-secondary leading-relaxed">{selectedVariation.result_description}</p>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Bir varyant seçin.</p>
            )}
          </div>

          <div className="glass rounded-2xl p-6 border border-glass-border">
            <VariantTree
              variations={selectedPosition.variations}
              selectedId={selectedVariationId}
              onSelect={(id) => { setSelectedVariationId(id); setShowComparison(false); }}
            />

            <button
              onClick={() => { setShowComparison(!showComparison); }}
              className="mt-4 btn-secondary w-full py-2.5 rounded-xl text-sm"
            >
              {showComparison ? 'Karşılaştırmayı Kapat' : 'Varyantları Karşılaştır'}
            </button>
          </div>

          {showComparison && (
            <div className="glass rounded-2xl p-6 border border-glass-border animate-fade-in">
              <VariantComparison position={selectedPosition} variations={selectedPosition.variations} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
