import { useState, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, StoneColor } from '../../types';

export function ExerciseView() {
  const {
    currentExercise,
    exerciseResult,
    exerciseAttempts,
    showHint,
    hintIndex,
    submitExerciseMove,
    showNextHint,
    setView,
    loadExercise,
  } = useAppStore();

  const [selectedMove, setSelectedMove] = useState<{ x: number; y: number } | null>(null);

  const handleBoardClick = useCallback(
    async (x: number, y: number) => {
      if (exerciseResult) return;
      setSelectedMove({ x, y });
      await submitExerciseMove(x, y);
    },
    [exerciseResult, submitExerciseMove]
  );

  if (!currentExercise) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <h2 className="text-2xl font-bold">Alıştırmalar</h2>
        <p className="text-text-secondary">Bir alıştırma seçin</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {['e1-1-1', 'e1-1-2'].map((id) => (
            <button
              key={id}
              onClick={() => loadExercise(id)}
              className="bg-bg-card hover:bg-bg-secondary border border-transparent hover:border-accent p-4 rounded-xl transition-all"
            >
              <div className="font-semibold">{id}</div>
              <div className="text-xs text-text-secondary">Alıştırma</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const boardSize = currentExercise.board_size as BoardSize;
  const board = createBoardFromStones(currentExercise.initial_stones, boardSize);

  // Show the correct move if answered incorrectly
  const highlights = [];
  if (exerciseResult && !exerciseResult.correct && exerciseResult.best_move) {
    highlights.push({
      x: exerciseResult.best_move[0],
      y: exerciseResult.best_move[1],
      type: 'good' as const,
    });
  }
  if (selectedMove && exerciseResult && !exerciseResult.correct) {
    highlights.push({
      x: selectedMove.x,
      y: selectedMove.y,
      type: 'bad' as const,
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className="bg-bg-card px-2 py-1 rounded">
            {EXERCISE_TYPE_LABELS[currentExercise.type] || currentExercise.type}
          </span>
          <span>Zorluk: {'⭐'.repeat(currentExercise.difficulty)}</span>
        </div>
        <h2 className="text-2xl font-bold">{currentExercise.title}</h2>
        <p className="text-text-secondary">{currentExercise.description}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Board */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-md">
            <Board
              size={boardSize}
              board={board}
              highlights={highlights}
              onIntersectionClick={handleBoardClick}
              interactive={!exerciseResult}
              showCoordinates={true}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="lg:w-72 space-y-4">
          {/* Status */}
          {exerciseResult && (
            <div
              className={`rounded-xl p-4 ${
                exerciseResult.correct
                  ? 'bg-success/10 border border-success'
                  : 'bg-error/10 border border-error'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">
                  {exerciseResult.correct ? '✓' : '✗'}
                </span>
                <span className="font-semibold">
                  {exerciseResult.correct ? 'Doğru!' : 'Yanlış'}
                </span>
              </div>
              <p className="text-sm">{exerciseResult.explanation}</p>
            </div>
          )}

          {/* Hints */}
          <div className="bg-bg-card rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">İpuçları</span>
              <span className="text-xs text-text-secondary">
                {hintIndex}/{currentExercise.hints.length}
              </span>
            </div>
            {showHint && hintIndex > 0 && (
              <div className="space-y-2 mb-3">
                {currentExercise.hints.slice(0, hintIndex).map((hint, i) => (
                  <p key={i} className="text-sm text-text-secondary bg-bg-primary rounded p-2">
                    💡 {hint}
                  </p>
                ))}
              </div>
            )}
            {!exerciseResult && hintIndex < currentExercise.hints.length && (
              <button
                onClick={showNextHint}
                className="w-full py-2 rounded-lg bg-bg-primary hover:bg-bg-secondary text-text-secondary text-sm transition-colors"
              >
                İpucu Göster
              </button>
            )}
          </div>

          {/* Attempts */}
          <div className="bg-bg-card rounded-xl p-4">
            <div className="text-sm text-text-secondary">Deneme Sayısı</div>
            <div className="text-2xl font-bold">{exerciseAttempts}</div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            <button
              onClick={() => setView('home')}
              className="flex-1 py-2 rounded-lg bg-bg-card hover:bg-bg-secondary text-text-secondary transition-colors"
            >
              Geri
            </button>
            {exerciseResult && (
              <button
                onClick={() => loadExercise(currentExercise.id)}
                className="flex-1 py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
              >
                Tekrar Dene
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function createBoardFromStones(
  stones: { x: number; y: number; color: string }[],
  size: number
): (StoneColor | null)[][] {
  const board: (StoneColor | null)[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(null));

  for (const stone of stones) {
    if (stone.x >= 0 && stone.x < size && stone.y >= 0 && stone.y < size) {
      board[stone.y][stone.x] = stone.color as StoneColor;
    }
  }

  return board;
}

const EXERCISE_TYPE_LABELS: Record<string, string> = {
  place_correct: 'Doğru Hamle',
  capture_stones: 'Taş Yakalama',
  defend_group: 'Grup Savunma',
  life_and_death: 'Yaşam ve Ölüm',
  connect_groups: 'Grup Bağlama',
  cut_groups: 'Grup Kesme',
  territorial_control: 'Alan Kontrolü',
  endgame: 'Bitiriş',
  opening: 'Açılış',
  tesuji: 'Tesuji',
  reading_comprehension: 'Okuma',
};
