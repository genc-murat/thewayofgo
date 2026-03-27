import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, StoneColor, Highlight } from '../../types';

const EXERCISE_CATALOG = [
  { id: 'e1-1-1', level: 1, module: 1, title: 'İlk Hamle', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-2', level: 1, module: 1, title: 'Özgürlük Sayısı', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-3', level: 1, module: 1, title: 'Taşı Yakala', type: 'Taş Yakalama', difficulty: 1 },
  { id: 'e1-1-4', level: 1, module: 1, title: 'Yasak Hamleyi Bul', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-1-5', level: 1, module: 1, title: 'Ko Durumu', type: 'Taş Yakalama', difficulty: 1 },
  { id: 'e1-2-1', level: 1, module: 2, title: 'Grubu Güçlendir', type: 'Doğru Hamle', difficulty: 1 },
  { id: 'e1-2-2', level: 1, module: 2, title: 'İki Göz Yap', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-3', level: 1, module: 2, title: 'Grubu Yaşatın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-2-4', level: 1, module: 2, title: 'Sahte Gözü Tanıyın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e1-3-1', level: 1, module: 3, title: 'Açılış Stratejisi', type: 'Açılış', difficulty: 1 },
  { id: 'e1-3-2', level: 1, module: 3, title: 'Alanı Belirleyin', type: 'Alan Kontrolü', difficulty: 1 },
  { id: 'e1-3-3', level: 1, module: 3, title: 'Açılış Hamlesi', type: 'Açılış', difficulty: 1 },
  { id: 'e2-1-1', level: 2, module: 1, title: 'Merdiveni Başlat', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-1-2', level: 2, module: 1, title: 'Merdiven Kırıcıyı Kullan', type: 'Doğru Hamle', difficulty: 3 },
  { id: 'e2-1-3', level: 2, module: 1, title: 'Ağ Atın', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-4', level: 2, module: 1, title: 'Snepbek Yapın', type: 'Taş Yakalama', difficulty: 3 },
  { id: 'e2-1-5', level: 2, module: 1, title: 'Grubu Yakalayın', type: 'Taş Yakalama', difficulty: 2 },
  { id: 'e2-2-1', level: 2, module: 2, title: 'Kaplan Ağzı Yapın', type: 'Grup Bağlama', difficulty: 2 },
  { id: 'e2-2-2', level: 2, module: 2, title: 'Beyaz Grubu Kesin', type: 'Grup Kesme', difficulty: 3 },
  { id: 'e2-2-3', level: 2, module: 2, title: 'Köprü Kurun', type: 'Grup Bağlama', difficulty: 3 },
  { id: 'e2-2-4', level: 2, module: 2, title: 'Bağlantıyı Koruyun', type: 'Grup Savunma', difficulty: 3 },
  { id: 'e2-3-1', level: 2, module: 3, title: 'İki Göz Yapın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-3-2', level: 2, module: 3, title: 'Grubu Yaşatın', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-3-3', level: 2, module: 3, title: 'Beyaz Grubu Öldürün', type: 'Yaşam ve Ölüm', difficulty: 3 },
  { id: 'e2-3-4', level: 2, module: 3, title: 'Ölüm Şeklini Tanıyın', type: 'Yaşam ve Ölüm', difficulty: 2 },
  { id: 'e2-4-1', level: 2, module: 4, title: 'Büyük Yose Oynayın', type: 'Bitiriş', difficulty: 2 },
  { id: 'e2-4-2', level: 2, module: 4, title: 'Doğru Sırayı Bulun', type: 'Bitiriş', difficulty: 3 },
  { id: 'e2-4-3', level: 2, module: 4, title: 'Hane Hesaplayın', type: 'Alan Kontrolü', difficulty: 3 },
  { id: 'e2-4-4', level: 2, module: 4, title: 'Skor Tahmini Yapın', type: 'Alan Kontrolü', difficulty: 2 },
];

const TYPE_COLORS: Record<string, string> = {
  'Doğru Hamle': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Taş Yakalama': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Yaşam ve Ölüm': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Grup Bağlama': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'Grup Kesme': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Grup Savunma': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Alan Kontrolü': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Bitiriş': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Açılış': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
};

export function ExerciseView() {
  const {
    currentExercise, loadExercise,
  } = useAppStore();

  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const filteredCatalog = useMemo(() => {
    let items = EXERCISE_CATALOG;
    if (filterLevel !== null) items = items.filter(e => e.level === filterLevel);
    if (filterType !== null) items = items.filter(e => e.type === filterType);
    return items;
  }, [filterLevel, filterType]);

  const types = useMemo(() => [...new Set(EXERCISE_CATALOG.map(e => e.type))], []);

  if (currentExercise) return <ExercisePlayer />;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Alıştırmalar</h2>
        <p className="text-text-secondary">Seviye ve türe göre filtreleyerek çalışın ({EXERCISE_CATALOG.length} alıştırma)</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterLevel(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tümü
        </button>
        {[1, 2, 3, 4].map(lvl => (
          <button key={lvl} onClick={() => setFilterLevel(lvl === filterLevel ? null : lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === lvl ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            Seviye {lvl}
          </button>
        ))}
        <span className="w-px h-6 bg-glass-border self-center mx-1" />
        <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tüm Türler
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t === filterType ? null : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCatalog.map(ex => (
          <button key={ex.id} onClick={() => loadExercise(ex.id)}
            className="glass rounded-2xl p-5 text-left card-hover border border-glass-border hover:border-accent/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[ex.type] || 'glass text-text-secondary'}`}>
                {ex.type}
              </span>
              <span className="text-xs text-text-secondary">Seviye {ex.level}</span>
            </div>
            <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">{ex.title}</h4>
            <div className="flex items-center gap-1 text-xs text-accent">
              {'★'.repeat(ex.difficulty)}{'☆'.repeat(5 - ex.difficulty)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExercisePlayer() {
  const {
    currentExercise, exerciseResult, exerciseAttempts,
    submitExerciseMove, closeExercise, loadExercise,
  } = useAppStore();

  const handleBoardClick = useCallback(async (x: number, y: number) => {
    if (exerciseResult || !currentExercise) return;
    await submitExerciseMove(x, y);
  }, [exerciseResult, submitExerciseMove, currentExercise]);

  if (!currentExercise) return null;

  const boardSize = currentExercise.board_size as BoardSize;
  const board = createBoardFromStones(currentExercise.initial_stones, boardSize);

  const highlights: Highlight[] = [];
  if (exerciseResult && !exerciseResult.correct && exerciseResult.best_move) {
    highlights.push({ x: exerciseResult.best_move[0], y: exerciseResult.best_move[1], type: 'good' });
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={() => closeExercise()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Tüm Alıştırmalar
        </button>

        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[currentExercise.title] || ''}`}>
            {currentExercise.type}
          </span>
          <span className="text-xs">Zorluk: {'★'.repeat(currentExercise.difficulty)}{'☆'.repeat(5 - currentExercise.difficulty)}</span>
        </div>
        <h2 className="text-2xl font-bold">{currentExercise.title}</h2>
        <p className="text-text-secondary mt-1">{currentExercise.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm glass rounded-2xl p-4">
            <Board size={boardSize} board={board} highlights={highlights} onIntersectionClick={handleBoardClick} interactive={!exerciseResult} showCoordinates={true} />
          </div>
        </div>

        <div className="lg:w-72 space-y-4">
          {exerciseResult && (
            <div className={`animate-scale-in rounded-2xl p-5 border ${
              exerciseResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${exerciseResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {exerciseResult.correct ? '✓' : '✗'}
                </div>
                <span className="font-bold">{exerciseResult.correct ? 'Doğru!' : 'Yanlış'}</span>
              </div>
              <p className="text-sm text-text-secondary">{exerciseResult.explanation}</p>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-text-secondary mb-1">Deneme Sayısı</div>
            <div className="text-3xl font-bold">{exerciseAttempts}</div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => closeExercise()} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Listeye Dön</button>
            {exerciseResult && (
              <button onClick={() => loadExercise(currentExercise.id)} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">Tekrar Dene</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function createBoardFromStones(stones: { x: number; y: number; color: string }[], size: number): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }
  return board;
}
