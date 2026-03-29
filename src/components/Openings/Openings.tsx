import { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import josekiData from '../../data/joseki.json';
import type { BoardSize, StoneColor, Joseki } from '../../types';

export function Openings() {
  const { startAiGame, setView } = useAppStore();
  const [selectedJoseki, setSelectedJoseki] = useState<Joseki | null>(null);
  const [showVariation, setShowVariation] = useState<{ name: string; moves: { x: number; y: number; color: StoneColor }[]; explanation?: string } | null>(null);

  const joseki: Joseki[] = josekiData.joseki as Joseki[];

  const handleSelectJoseki = (j: Joseki) => {
    setSelectedJoseki(j);
    setShowVariation(null);
  };

  const handleSelectVariation = (v: { name: string; moves: { x: number; y: number; color: StoneColor }[]; explanation?: string }) => {
    setShowVariation(v);
  };

  const handleStartGameWithJoseki = () => {
    if (!selectedJoseki) return;
    setView('play');
    startAiGame(9, 2, 'balanced', 6.5);
  };

  // Helper function to create a board from moves
  function createInitialBoard(moves: { x: number; y: number; color: StoneColor }[]): (StoneColor | null)[][] {
    const board: (StoneColor | null)[][] = Array.from({ length: 9 }, () => Array(9).fill(null));
    for (const stone of moves) {
      board[stone.y][stone.x] = stone.color;
    }
    return board;
  }

  if (!selectedJoseki && !showVariation) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Açılımlar (Joseki)</h2>
          <p className="text-text-secondary">Go'nun temel açılış kalıplarını keşfedin ve öğrenin.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {joseki.map((j) => (
            <div key={j.id} className="glass rounded-2xl p-5 border border-glass-border hover:border-accent/30 transition-all cursor-pointer"
              onClick={() => handleSelectJoseki(j)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">{j.name}</h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-400">
                    {'★'.repeat(j.stars_required)}
                    {'☆'.repeat(5 - j.stars_required)}
                  </span>
                  <span className="text-text-secondary">Zorluk: {j.difficulty}/10</span>
                </div>
              </div>
              <p className="text-text-secondary">{j.description}</p>
              <div className="mt-4">
                <Board
                  size={9 as BoardSize}
                  board={createInitialBoard(j.moves)}
                  lastMove={j.moves.length > 0 ? { x: j.moves[j.moves.length - 1].x, y: j.moves[j.moves.length - 1].y } : null}
                  showCoordinates={true}
                  interactive={false}
                />
              </div>
              <div className="mt-3 text-xs text-text-secondary text-center">
                {j.moves.length} hamle • Başlangıç pozisyonu
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleStartGameWithJoseki}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-medium"
          >
            Seçili Joseki ile Oyun Başlat
          </button>
        </div>
      </div>
    );
  }

  if (selectedJoseki && !showVariation) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <button onClick={() => setSelectedJoseki(null)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Joseki Listesi
          </button>
          <h2 className="text-2xl font-bold">{selectedJoseki.name}</h2>
          <p className="text-text-secondary">{selectedJoseki.description}</p>
        </div>

        <div className="space-y-4">
          {selectedJoseki.variations.map((v) => (
            <div key={v.name} className="glass rounded-2xl p-4 border border-glass-border hover:border-accent/30 transition-all cursor-pointer"
              onClick={() => handleSelectVariation(v)}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">{v.name}</h3>
                <span className="text-xs text-text-secondary">{v.explanation ?? ''}</span>
              </div>
              <div className="mt-2">
                <Board
                  size={9 as BoardSize}
                  board={createInitialBoard([...selectedJoseki.moves, ...v.moves])}
                  lastMove={v.moves.length > 0 ? { x: v.moves[v.moves.length - 1].x, y: v.moves[v.moves.length - 1].y } : null}
                  showCoordinates={true}
                  interactive={false}
                />
              </div>
              <div className="mt-2 text-xs text-text-secondary text-center">
                {selectedJoseki.moves.length + v.moves.length} hamle • Varyasyon
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleStartGameWithJoseki}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-medium"
          >
            Joseki ile Oyun Başlat
          </button>
        </div>
      </div>
    );
  }

  if (showVariation) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <button onClick={() => setShowVariation(null)} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            Varyasyonlar
          </button>
          <h2 className="text-2xl font-bold">{selectedJoseki!.name} - {showVariation.name}</h2>
          <p className="text-text-secondary">{showVariation.explanation ?? ''}</p>
        </div>

        <div className="mt-4">
          <Board
            size={9 as BoardSize}
            board={createInitialBoard([...selectedJoseki!.moves, ...showVariation.moves])}
            lastMove={showVariation.moves.length > 0 ? { x: showVariation.moves[showVariation.moves.length - 1].x, y: showVariation.moves[showVariation.moves.length - 1].y } : null}
            showCoordinates={true}
            interactive={false}
          />
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleStartGameWithJoseki}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-medium"
          >
            Joseki ile Oyun Başlat
          </button>
        </div>
      </div>
    );
  }

  return null;
}