import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, ScoreResult } from '../../types';

export function GamePlay() {
  const {
    game, gameResult, isAiGame, aiDifficulty,
    placeStone, pass: doPass, resign: doResign,
    aiMove, setView, startAiGame,
  } = useAppStore();

  const [showScore, setShowScore] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (isAiGame && game && !game.game_over && game.current_player === 'white' && !isThinking) {
      setIsThinking(true);
      const timer = setTimeout(async () => {
        await aiMove();
        setIsThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game?.current_player, game?.game_over, isAiGame, isThinking, aiMove]);

  const handleIntersectionClick = useCallback(async (x: number, y: number) => {
    if (!game || game.game_over) return;
    if (isAiGame && game.current_player === 'white') return;
    const result = await placeStone(x, y);
    if (result?.game_over) setShowScore(true);
  }, [game, isAiGame, placeStone]);

  const handlePass = useCallback(async () => {
    const result = await doPass();
    if (result?.game_over) setShowScore(true);
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
      <div className="flex flex-col items-center justify-center py-16 gap-10 animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold text-center mb-2">Yeni Oyun</h2>
          <p className="text-text-secondary text-center">Tahta boyutunu ve zorluğu seçin</p>
        </div>

        <div className="flex gap-6">
          {[
            { size: 9, label: '9x9', desc: 'Başlangıç', color: 'border-emerald-500/30' },
            { size: 13, label: '13x13', desc: 'Orta', color: 'border-blue-500/30' },
            { size: 19, label: '19x19', desc: 'Uzman', color: 'border-purple-500/30' },
          ].map((opt) => (
            <button key={opt.size} onClick={() => startAiGame(opt.size, aiDifficulty)}
              className={`glass rounded-2xl p-6 text-center card-hover border ${opt.color} min-w-[120px]`}>
              <div className="text-3xl font-bold mb-1">{opt.label}</div>
              <div className="text-xs text-text-secondary">{opt.desc}</div>
            </button>
          ))}
        </div>

        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-text-secondary mb-3 font-medium text-center">Zorluk Seviyesi</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button key={level} onClick={() => useAppStore.getState().setAiDifficulty(level)}
                className={`w-12 h-12 rounded-xl font-bold text-lg transition-all ${
                  aiDifficulty === level
                    ? 'gradient-accent text-bg-primary shadow-lg glow-accent-sm scale-105'
                    : 'glass text-text-secondary hover:text-text-primary card-hover'
                }`}>
                {level}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-text-secondary px-1">
            <span>Kolay</span><span>Zor</span>
          </div>
        </div>
      </div>
    );
  }

  const boardSize = game.board_size as BoardSize;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-2xl glass rounded-2xl p-4">
          <Board size={boardSize} board={game.board} lastMove={game.last_move} onIntersectionClick={handleIntersectionClick} interactive={!game.game_over} showCoordinates={true} />
        </div>
      </div>

      <div className="lg:w-80 space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <PlayerInfo color="black" captures={game.black_captures} isActive={game.current_player === 'black'} isAi={isAiGame} />
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs text-text-secondary font-medium">HAMLE</span>
              <span className="text-2xl font-bold text-text-primary">{game.move_number}</span>
            </div>
            <PlayerInfo color="white" captures={game.white_captures} isActive={game.current_player === 'white'} isAi={isAiGame} />
          </div>

          <div className={`text-center py-3 rounded-xl text-sm font-medium ${
            game.game_over ? 'bg-accent/10 text-accent' :
            isThinking ? 'bg-info/10 text-info' :
            'bg-bg-primary/50 text-text-secondary'
          }`}>
            {game.game_over ? (
              <span>Oyun Bitti</span>
            ) : isThinking ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-info/30 border-t-info rounded-full animate-spin-slow" />
                Yapay zeka düşünüyorsunuz...
              </span>
            ) : (
              <span>Sıra: <strong className="text-text-primary">{game.current_player === 'black' ? 'Siyah' : 'Beyaz'}</strong></span>
            )}
          </div>
        </div>

        {gameResult && showScore && gameResult.score && <ScoreDisplay score={gameResult.score} />}

        <div className="flex flex-col gap-2">
          {!game.game_over ? (
            <>
              <button onClick={handlePass} disabled={isAiGame && game.current_player === 'white'}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl glass hover:bg-bg-secondary text-text-primary font-medium transition-all disabled:opacity-30">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.868a1 1 0 001.016-1.713A3.383 3.383 0 0110 12c1.008 0 1.914.44 2.52 1.155a1 1 0 101.016-1.713A5.383 5.383 0 0010 10a5.383 5.383 0 00-3.536 1.868z" clipRule="evenodd" /></svg>
                Pas
              </button>
              <button onClick={handleResign}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-error/10 hover:bg-error/20 text-error font-medium transition-all border border-error/20">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 008.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" /></svg>
                Çekil
              </button>
            </>
          ) : (
            <button onClick={() => setView('home')} className="btn-primary w-full py-3 rounded-xl">
              Ana Sayfaya Dön
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerInfo({ color, captures, isActive, isAi }: { color: 'black' | 'white'; captures: number; isActive: boolean; isAi: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-accent/10 ring-1 ring-accent/50 scale-105' : ''}`}>
      <div className={`w-10 h-10 rounded-full ${
        color === 'black' ? 'bg-gradient-to-br from-gray-600 to-gray-900 ring-1 ring-gray-700' : 'bg-gradient-to-br from-white to-gray-200 ring-1 ring-gray-300'
      }`} />
      <span className="text-xs font-semibold">{color === 'black' ? 'Siyah' : 'Beyaz'}{isAi && color === 'white' ? ' (AI)' : ''}</span>
      <span className="text-xs text-text-secondary">{captures} yakalanan</span>
    </div>
  );
}

function ScoreDisplay({ score }: { score: ScoreResult }) {
  return (
    <div className="glass rounded-2xl p-5 animate-scale-in">
      <h3 className="font-bold text-center mb-4 text-lg">Skor</h3>
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between"><span className="text-text-secondary">Siyah Alan</span><span className="font-medium">{score.black_territory}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Siyah Yakalanan</span><span>+{score.black_captures}</span></div>
        <div className="flex justify-between font-bold text-base"><span>Siyah Toplam</span><span>{score.black_total}</span></div>
        <hr className="border-glass-border" />
        <div className="flex justify-between"><span className="text-text-secondary">Beyaz Alan</span><span className="font-medium">{score.white_territory}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Beyaz Yakalanan</span><span>+{score.white_captures}</span></div>
        <div className="flex justify-between"><span className="text-text-secondary">Komi</span><span>+{score.komi}</span></div>
        <div className="flex justify-between font-bold text-base"><span>Beyaz Toplam</span><span>{score.white_total}</span></div>
        <hr className="border-glass-border" />
        <div className="flex justify-between text-lg font-bold text-accent pt-1">
          <span>Kazanan</span>
          <span>{score.winner === 'black' ? 'Siyah' : 'Beyaz'} ({score.margin.toFixed(1)})</span>
        </div>
      </div>
    </div>
  );
}
