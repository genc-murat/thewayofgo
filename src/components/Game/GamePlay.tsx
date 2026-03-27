import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, ScoreResult } from '../../types';

export function GamePlay() {
  const {
    game,
    gameResult,
    isAiGame,
    aiDifficulty,
    placeStone,
    pass: doPass,
    resign: doResign,
    aiMove,
    setView,
    startAiGame,
  } = useAppStore();

  const [showScore, setShowScore] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Handle AI turn
  useEffect(() => {
    if (
      isAiGame &&
      game &&
      !game.game_over &&
      game.current_player === 'white' &&
      !isThinking
    ) {
      setIsThinking(true);
      const timer = setTimeout(async () => {
        await aiMove();
        setIsThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game?.current_player, game?.game_over, isAiGame, isThinking, aiMove]);

  const handleIntersectionClick = useCallback(
    async (x: number, y: number) => {
      if (!game || game.game_over) return;
      if (isAiGame && game.current_player === 'white') return;

      const result = await placeStone(x, y);
      if (result?.game_over) {
        setShowScore(true);
      }
    },
    [game, isAiGame, placeStone]
  );

  const handlePass = useCallback(async () => {
    const result = await doPass();
    if (result?.game_over) {
      setShowScore(true);
    }
  }, [doPass]);

  const handleResign = useCallback(async () => {
    if (confirm('Oyundan çekilmek istediğinize emin misiniz?')) {
      const player = isAiGame ? 'black' : game?.current_player || 'black';
      await doResign(player);
      setShowScore(true);
    }
  }, [doResign, isAiGame, game]);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-6">
        <h2 className="text-2xl font-bold">Yeni Oyun</h2>
        <p className="text-text-secondary">Tahta boyutunu seçin</p>
        <div className="flex gap-4">
          {[
            { size: 9, label: '9x9' },
            { size: 13, label: '13x13' },
            { size: 19, label: '19x19' },
          ].map((opt) => (
            <button
              key={opt.size}
              onClick={() => startAiGame(opt.size, aiDifficulty)}
              className="bg-bg-card hover:bg-bg-secondary border border-transparent hover:border-accent px-8 py-4 rounded-xl transition-all"
            >
              <div className="text-2xl font-bold mb-1">{opt.label}</div>
              <div className="text-xs text-text-secondary">Yapay Zeka ile</div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <p className="text-text-secondary text-sm mb-2">Zorluk Seviyesi</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => useAppStore.getState().setAiDifficulty(level)}
                className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                  aiDifficulty === level
                    ? 'bg-accent text-black'
                    : 'bg-bg-card text-text-secondary hover:text-text-primary'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const boardSize = game.board_size as BoardSize;
  const validMoves: { x: number; y: number }[] = [];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Board section */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-lg">
          <Board
            size={boardSize}
            board={game.board}
            lastMove={game.last_move}
            validMoves={validMoves}
            onIntersectionClick={handleIntersectionClick}
            interactive={!game.game_over}
            showCoordinates={true}
          />
        </div>
      </div>

      {/* Info panel */}
      <div className="lg:w-72 space-y-4">
        {/* Player info */}
        <div className="bg-bg-card rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <PlayerInfo
              color="black"
              captures={game.black_captures}
              isActive={game.current_player === 'black'}
              isAi={isAiGame}
            />
            <span className="text-text-secondary">vs</span>
            <PlayerInfo
              color="white"
              captures={game.white_captures}
              isActive={game.current_player === 'white'}
              isAi={isAiGame}
            />
          </div>

          {/* Turn indicator */}
          <div className="text-center py-2 rounded-lg bg-bg-primary">
            {game.game_over ? (
              <span className="text-accent font-semibold">Oyun Bitti</span>
            ) : isThinking ? (
              <span className="text-text-secondary">Düşünüyor...</span>
            ) : (
              <span className="text-text-secondary">
                Sıra: <span className="font-semibold text-text-primary">
                  {game.current_player === 'black' ? 'Siyah' : 'Beyaz'}
                </span>
                {isAiGame && game.current_player === 'white' && ' (AI)'}
              </span>
            )}
          </div>
        </div>

        {/* Move info */}
        <div className="bg-bg-card rounded-xl p-4">
          <div className="text-sm text-text-secondary mb-1">Hamle</div>
          <div className="text-2xl font-bold">{game.move_number}</div>
        </div>

        {/* Game result */}
        {gameResult && showScore && gameResult.score && (
          <ScoreDisplay score={gameResult.score} />
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {!game.game_over && (
            <>
              <button
                onClick={handlePass}
                disabled={isAiGame && game.current_player === 'white'}
                className="w-full py-2 rounded-lg bg-bg-card hover:bg-bg-secondary text-text-primary font-medium transition-colors disabled:opacity-50"
              >
                Pas
              </button>
              <button
                onClick={handleResign}
                className="w-full py-2 rounded-lg bg-error/20 hover:bg-error/30 text-error font-medium transition-colors"
              >
                Çekil
              </button>
            </>
          )}
          {game.game_over && (
            <button
              onClick={() => setView('home')}
              className="w-full py-2 rounded-lg bg-accent hover:bg-accent-hover text-black font-semibold transition-colors"
            >
              Ana Sayfaya Dön
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerInfo({
  color,
  captures,
  isActive,
  isAi,
}: {
  color: 'black' | 'white';
  captures: number;
  isActive: boolean;
  isAi: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
        isActive ? 'bg-accent/10 ring-1 ring-accent' : ''
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full border-2 ${
          color === 'black'
            ? 'bg-stone-black border-stone-black'
            : 'bg-stone-white border-stone-white'
        }`}
      />
      <span className="text-xs font-medium">
        {color === 'black' ? 'Siyah' : 'Beyaz'}
        {isAi && color === 'white' && ' (AI)'}
      </span>
      <span className="text-xs text-text-secondary">{captures} yakalanan</span>
    </div>
  );
}

function ScoreDisplay({ score }: { score: ScoreResult }) {
  return (
    <div className="bg-bg-card rounded-xl p-4">
      <h3 className="font-semibold mb-3 text-center">Skor</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-text-secondary">Siyah Alan</span>
          <span>{score.black_territory}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Siyah Yakalanan</span>
          <span>+{score.black_captures}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Siyah Toplam</span>
          <span>{score.black_total}</span>
        </div>
        <hr className="border-bg-primary" />
        <div className="flex justify-between">
          <span className="text-text-secondary">Beyaz Alan</span>
          <span>{score.white_territory}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Beyaz Yakalanan</span>
          <span>+{score.white_captures}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Komi</span>
          <span>+{score.komi}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Beyaz Toplam</span>
          <span>{score.white_total}</span>
        </div>
        <hr className="border-bg-primary" />
        <div className="flex justify-between text-lg font-bold text-accent">
          <span>Kazanan</span>
          <span>
            {score.winner === 'black' ? 'Siyah' : 'Beyaz'} ({score.margin.toFixed(1)} fark)
          </span>
        </div>
      </div>
    </div>
  );
}
