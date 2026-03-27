import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import { invoke } from '@tauri-apps/api/core';
import { getSavedGames, formatGameResult, formatDuration, saveGame } from '../../utils/gameHistory';
import type { BoardSize, ScoreResult, MoveRecord, Point, AIStyle } from '../../types';
import type { SavedGame } from '../../utils/gameHistory';

const COLUMN_LABELS = 'ABCDEFGHJKLMNOPQRST';

function formatMove(record: MoveRecord, index: number): string {
  const num = index + 1;
  const color = record.player === 'black' ? 'S' : 'B';
  if (record.move_type === 'pass') return `${num}. ${color} Pas`;
  if (record.move_type === 'resign') return `${num}. ${color} Çekil`;
  const col = COLUMN_LABELS[record.x ?? 0];
  const row = (record.y ?? 0) + 1;
  const captures = record.captured_stones.length > 0 ? ` (+${record.captured_stones.length})` : '';
  return `${num}. ${color} ${col}${row}${captures}`;
}

export function GamePlay() {
  const {
    game, gameResult, isAiGame, aiDifficulty, aiStyle,
    placeStone, pass: doPass, resign: doResign,
    aiMove, setView, startAiGame, setAiStyle, undoMove, getMoveHistory,
  } = useAppStore();

  const [showScore, setShowScore] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [showMoveList, setShowMoveList] = useState(false);
  const [showValidMoves, setShowValidMoves] = useState(false);
  const [validMoves, setValidMoves] = useState<Point[]>([]);
  const [recentGames, setRecentGames] = useState<SavedGame[]>([]);
  const [lastMoveAnalysis, setLastMoveAnalysis] = useState<string | null>(null);
  const aiThinkingRef = useRef(false);

  // Load recent games on mount
  useEffect(() => {
    getSavedGames(5).then(setRecentGames).catch(() => {});
  }, []);

  useEffect(() => {
    if (isAiGame && game && !game.game_over && game.current_player === 'white' && !aiThinkingRef.current) {
      aiThinkingRef.current = true;
      setIsThinking(true);
      const timer = setTimeout(async () => {
        const result = await aiMove();
        aiThinkingRef.current = false;
        setIsThinking(false);
        if (result?.game_over) setShowScore(true);
        const history = await getMoveHistory();
        setMoveHistory(history);

        // Analyze AI's move
        if (game) {
          const lastMove = history[history.length - 1];
          if (lastMove && lastMove.x != null && lastMove.y != null) {
            invoke<{ explanation: string; confidence: number }>('analyze_move', {
              x: lastMove.x,
              y: lastMove.y,
            }).then(analysis => {
              setLastMoveAnalysis(analysis.explanation);
            }).catch(() => {});
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [game?.current_player, game?.game_over, isAiGame, aiMove, getMoveHistory]);

  useEffect(() => {
    if (game && !game.game_over && !isAiGame) {
      getMoveHistory().then(setMoveHistory);
    }
  }, [game?.move_number, isAiGame, getMoveHistory]);

  // Fetch valid moves when showValidMoves is enabled
  useEffect(() => {
    if (showValidMoves && game && !game.game_over) {
      invoke<Point[]>('get_valid_moves').then(setValidMoves).catch(() => setValidMoves([]));
    } else {
      setValidMoves([]);
    }
  }, [showValidMoves, game?.move_number, game?.game_over]);

  // Auto-save completed games
  const gameSavedRef = useRef(false);
  useEffect(() => {
    if (game?.game_over && isAiGame && !gameSavedRef.current) {
      gameSavedRef.current = true;
      const winner = gameResult?.winner || 'unknown';
      const result = winner === 'black' ? 'black_wins' : 'white_wins';
      saveGame(game.board_size, 'ai', result, game.move_number, 0)
        .then(() => getSavedGames(5).then(setRecentGames))
        .catch(() => {});
    }
    if (!game?.game_over) {
      gameSavedRef.current = false;
    }
  }, [game?.game_over, gameResult?.winner, isAiGame]);

  const handleIntersectionClick = useCallback(async (x: number, y: number) => {
    if (!game || game.game_over) return;
    if (isAiGame && game.current_player === 'white') return;
    const result = await placeStone(x, y);
    if (result?.game_over) setShowScore(true);
    if (isAiGame) {
      const history = await getMoveHistory();
      setMoveHistory(history);
    }

    // Analyze human's move
    invoke<{ explanation: string; confidence: number }>('analyze_move', { x, y })
      .then(analysis => setLastMoveAnalysis(analysis.explanation))
      .catch(() => {});
  }, [game, isAiGame, placeStone, getMoveHistory]);

  const handlePass = useCallback(async () => {
    const result = await doPass();
    if (result?.game_over) setShowScore(true);
    const history = await getMoveHistory();
    setMoveHistory(history);
  }, [doPass, getMoveHistory]);

  const handleResign = useCallback(async () => {
    if (confirm('Oyundan çekilmek istediğinize emin misiniz?')) {
      const player = isAiGame ? 'black' : game?.current_player || 'black';
      await doResign(player);
      setShowScore(true);
    }
  }, [doResign, isAiGame, game]);

  const handleUndo = useCallback(async () => {
    if (!game || game.game_over || isThinking) return;
    if (isAiGame) {
      await undoMove();
      await undoMove();
    } else {
      await undoMove();
    }
    const history = await getMoveHistory();
    setMoveHistory(history);
    setShowScore(false);
    aiThinkingRef.current = false;
    setIsThinking(false);
  }, [game, isAiGame, isThinking, undoMove, getMoveHistory]);

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
            <button key={opt.size} onClick={() => startAiGame(opt.size, aiDifficulty, aiStyle)}
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

        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-text-secondary mb-3 font-medium text-center">Oyun Stili</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { style: 'balanced' as AIStyle, label: 'Dengeli', desc: 'Dengeli strateji, standart Go oynar', icon: '⚖️' },
              { style: 'aggressive' as AIStyle, label: 'Agresif', desc: 'Taş yakalama odaklı, saldırgan oynar', icon: '⚔️' },
              { style: 'defensive' as AIStyle, label: 'Savunmacı', desc: 'Grup güvenliği öncelikli, sağlam oynar', icon: '🛡️' },
              { style: 'educational' as AIStyle, label: 'Eğitici', desc: 'Öğrenme odaklı, hamlelerini açıklar', icon: '📖' },
            ]).map((opt) => (
              <button key={opt.style} onClick={() => setAiStyle(opt.style)}
                className={`p-3 rounded-xl text-left transition-all border ${
                  aiStyle === opt.style
                    ? 'bg-accent/10 border-accent/40 ring-1 ring-accent/30'
                    : 'glass border-transparent hover:bg-bg-secondary card-hover'
                }`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{opt.icon}</span>
                  <span className="text-sm font-semibold">{opt.label}</span>
                </div>
                <div className="text-[10px] text-text-secondary mt-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent games */}
        {recentGames.length > 0 && (
          <div className="w-full max-w-md glass rounded-2xl p-6">
            <h3 className="font-bold text-sm mb-4 text-text-secondary">Son Oyunlar</h3>
            <div className="space-y-2">
              {recentGames.map((g) => (
                <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-bg-primary/40">
                  <div>
                    <div className="text-sm font-medium">{g.board_size}x{g.board_size} vs {g.opponent === 'ai' ? 'AI' : 'İnsan'}</div>
                    <div className="text-xs text-text-secondary">{g.moves} hamle · {formatDuration(g.duration_seconds)}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-medium ${
                      g.result.includes('black') ? 'text-success' :
                      g.result.includes('white') ? 'text-error' :
                      'text-text-secondary'
                    }`}>
                      {formatGameResult(g.result)}
                    </div>
                    <div className="text-[10px] text-text-secondary">
                      {new Date(g.played_at).toLocaleDateString('tr-TR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const boardSize = game.board_size as BoardSize;
  const canUndo = game.move_number > 0 && !isThinking;

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-2xl glass rounded-2xl p-4">
          <Board size={boardSize} board={game.board} lastMove={game.last_move} validMoves={validMoves} showValidMoves={showValidMoves} onIntersectionClick={handleIntersectionClick} interactive={!game.game_over} showCoordinates={true} currentPlayer={game.current_player} />
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
            <PlayerInfo color="white" captures={game.white_captures} isActive={game.current_player === 'white'} isAi={isAiGame} aiStyle={aiStyle} />
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
                Yapay zeka düşünüyor...
              </span>
            ) : (
              <span>Sıra: <strong className="text-text-primary">{game.current_player === 'black' ? 'Siyah' : 'Beyaz'}</strong></span>
            )}
          </div>

          {/* AI Move Analysis */}
          {isAiGame && lastMoveAnalysis && !game.game_over && (
            <div className="mt-3 p-3 rounded-xl bg-info/5 border border-info/20">
              <div className="text-[10px] font-semibold text-info mb-1">AI Analizi</div>
              <p className="text-xs text-text-secondary">{lastMoveAnalysis}</p>
            </div>
          )}
        </div>

        {gameResult && showScore && gameResult.score && <ScoreDisplay score={gameResult.score} />}

        <div className="flex flex-col gap-2">
          {!game.game_over ? (
            <>
              <div className="flex gap-2">
                <button onClick={handleUndo} disabled={!canUndo}
                  className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl glass hover:bg-bg-secondary text-text-primary font-medium transition-all disabled:opacity-30">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.793 2.232a.75.75 0 01-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 010 10.75H10.75a.75.75 0 010-1.5h2.875a3.875 3.875 0 000-7.75H3.622l4.146 3.957a.75.75 0 01-1.036 1.085l-5.5-5.25a.75.75 0 010-1.085l5.5-5.25a.75.75 0 011.06.025z" clipRule="evenodd" /></svg>
                  Geri Al
                </button>
                <button onClick={handlePass} disabled={isAiGame && game.current_player === 'white'}
                  className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl glass hover:bg-bg-secondary text-text-primary font-medium transition-all disabled:opacity-30">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000-2 1 1 0 000 2zm7-1a1 1 0 11-2 0 1 1 0 012 0zm-7.536 5.868a1 1 0 001.016-1.713A3.383 3.383 0 0110 12c1.008 0 1.914.44 2.52 1.155a1 1 0 101.016-1.713A5.383 5.383 0 0010 10a5.383 5.383 0 00-3.536 1.868z" clipRule="evenodd" /></svg>
                  Pas
                </button>
              </div>
              <button onClick={() => setShowValidMoves(!showValidMoves)}
                className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all border ${
                  showValidMoves
                    ? 'bg-accent/10 text-accent border-accent/30'
                    : 'glass text-text-secondary hover:text-text-primary border-transparent'
                }`}>
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                {showValidMoves ? 'Hamle Yardımını Gizle' : 'Geçerli Hamleleri Göster'}
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

        {moveHistory.length > 0 && (
          <div className="glass rounded-2xl p-4">
            <button onClick={() => setShowMoveList(!showMoveList)}
              className="flex items-center justify-between w-full text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <span>Hamle Geçmişi ({moveHistory.length})</span>
              <svg className={`w-4 h-4 transition-transform ${showMoveList ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
            </button>
            {showMoveList && (
              <div className="mt-3 max-h-60 overflow-y-auto space-y-0.5 text-xs scrollbar-thin">
                {moveHistory.map((record, index) => (
                  <div key={index} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                    index === moveHistory.length - 1 ? 'bg-accent/10 text-accent' : 'text-text-secondary'
                  }`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      record.player === 'black' ? 'bg-gray-700' : 'bg-gray-200'
                    }`} />
                    <span className="font-mono">{formatMove(record, index)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerInfo({ color, captures, isActive, isAi, aiStyle }: { color: 'black' | 'white'; captures: number; isActive: boolean; isAi: boolean; aiStyle?: AIStyle }) {
  const styleLabels: Record<string, string> = {
    balanced: 'Dengeli',
    aggressive: 'Agresif',
    defensive: 'Savunmacı',
    educational: 'Eğitici',
  };
  const styleLabel = aiStyle && styleLabels[aiStyle] ? ` - ${styleLabels[aiStyle]}` : '';
  return (
    <div className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-accent/10 ring-1 ring-accent/50 scale-105' : ''}`}>
      <div className={`w-10 h-10 rounded-full ${
        color === 'black' ? 'bg-gradient-to-br from-gray-600 to-gray-900 ring-1 ring-gray-700' : 'bg-gradient-to-br from-white to-gray-200 ring-1 ring-gray-300'
      }`} />
      <span className="text-xs font-semibold">{color === 'black' ? 'Siyah' : 'Beyaz'}{isAi && color === 'white' ? ` (AI${styleLabel})` : ''}</span>
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
