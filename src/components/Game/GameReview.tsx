import { useState, useEffect, useCallback, useRef } from 'react';
import { Board } from '../Board';
import { invoke } from '@tauri-apps/api/core';
import type { BoardSize, MoveRecord, StoneColor, ScoreHistoryPoint } from '../../types';

interface GameReviewProps {
  moveHistory: MoveRecord[];
  onClose: () => void;
}

export function GameReview({ moveHistory, onClose }: GameReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1000);
  const intervalRef = useRef<number | null>(null);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryPoint[]>([]);
  const [showScoreGraph, setShowScoreGraph] = useState(false);
  const [scoreLoading, setScoreLoading] = useState(false);

  const currentBoard = currentIndex >= 0 && currentIndex < moveHistory.length
    ? moveHistory[currentIndex].board_snapshot
    : moveHistory.length > 0
      ? createEmptyBoard(moveHistory[0].board_snapshot.length)
      : [];

  const boardSize = currentBoard.length as BoardSize;

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = window.setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= moveHistory.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playSpeed, moveHistory.length]);

  const handleStepForward = useCallback(() => {
    if (currentIndex < moveHistory.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, moveHistory.length]);

  const handleStepBack = useCallback(() => {
    if (currentIndex > -1) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  const handleTogglePlay = useCallback(() => {
    if (currentIndex >= moveHistory.length - 1) {
      setCurrentIndex(-1);
    }
    setIsPlaying(prev => !prev);
  }, [currentIndex, moveHistory.length]);

  const handleGoToStart = useCallback(() => {
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, []);

  const handleGoToEnd = useCallback(() => {
    setCurrentIndex(moveHistory.length - 1);
    setIsPlaying(false);
  }, [moveHistory.length]);

  const currentMove = currentIndex >= 0 ? moveHistory[currentIndex] : null;
  const COLUMN_LABELS = 'ABCDEFGHJKLMNOPQRST';

  const fetchScoreHistory = useCallback(async () => {
    setScoreLoading(true);
    try {
      const result = await invoke<ScoreHistoryPoint[]>('get_game_score_history');
      setScoreHistory(result);
    } catch {
      setScoreHistory([]);
    }
    setScoreLoading(false);
  }, []);

  useEffect(() => {
    if (showScoreGraph && scoreHistory.length === 0) {
      fetchScoreHistory();
    }
  }, [showScoreGraph, fetchScoreHistory]);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Oyun Tekrarı</h2>
        <button onClick={onClose} className="btn-ghost px-4 py-2 rounded-xl text-sm">
          Kapat
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full max-w-2xl glass rounded-2xl p-4">
            {currentBoard.length > 0 && (
              <Board
                size={boardSize}
                board={currentBoard}
                lastMove={currentMove && currentMove.x != null && currentMove.y != null
                  ? { x: currentMove.x, y: currentMove.y }
                  : null}
                showCoordinates={true}
              />
            )}
          </div>

          {/* Playback controls */}
          <div className="flex items-center gap-3 mt-4">
            <button onClick={handleGoToStart} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleStepBack} disabled={currentIndex <= -1} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleTogglePlay} className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center text-bg-primary font-bold shadow-lg transition-all hover:scale-105">
              {isPlaying ? (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
              )}
            </button>
            <button onClick={handleStepForward} disabled={currentIndex >= moveHistory.length - 1} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary disabled:opacity-20 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
            </button>
            <button onClick={handleGoToEnd} className="w-10 h-10 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary transition-all">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M4.293 15.707a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" /><path d="M11.293 15.707a1 1 0 010-1.414L15.586 10l-4.293-4.293a1 1 0 011.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" /></svg>
            </button>
          </div>

          {/* Speed control */}
          <div className="flex items-center gap-3 mt-3">
            <span className="text-xs text-text-secondary">Hız:</span>
            {[2000, 1000, 500, 250].map(speed => (
              <button
                key={speed}
                onClick={() => setPlaySpeed(speed)}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  playSpeed === speed ? 'bg-accent/20 text-accent' : 'glass text-text-secondary hover:text-text-primary'
                }`}
              >
                {speed === 2000 ? '0.5x' : speed === 1000 ? '1x' : speed === 500 ? '2x' : '4x'}
              </button>
            ))}
          </div>

          {/* Score graph toggle */}
          <div className="mt-3">
            <button
              onClick={() => setShowScoreGraph(v => !v)}
              disabled={scoreLoading}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-all border ${
                showScoreGraph
                  ? 'bg-info/10 text-info border-info/30'
                  : 'glass text-text-secondary hover:text-text-primary border-transparent'
              } ${scoreLoading ? 'opacity-50' : ''}`}
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
              {scoreLoading ? 'Analiz ediliyor...' : showScoreGraph ? 'Skor Grafiğini Gizle' : 'Skor Grafiği'}
            </button>
          </div>

          {/* Score graph */}
          {showScoreGraph && scoreHistory.length > 0 && (
            <div className="mt-3 glass rounded-2xl p-4">
              <div className="text-xs font-semibold text-text-secondary mb-2">Skor Tahmini (Hamle Bazında)</div>
              <ScoreGraph points={scoreHistory} currentIndex={currentIndex} onPointClick={(idx) => { setCurrentIndex(idx - 1); setIsPlaying(false); }} />
            </div>
          )}
        </div>

        {/* Move list sidebar */}
        <div className="lg:w-72 space-y-4">
          <div className="glass rounded-2xl p-4">
            <div className="text-sm font-medium text-text-secondary mb-2">
              Hamle {currentIndex + 1} / {moveHistory.length}
            </div>
            <div className="h-1.5 bg-bg-primary/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${moveHistory.length > 0 ? ((currentIndex + 1) / moveHistory.length) * 100 : 0}%` }}
              />
            </div>
          </div>

          {currentMove && (
            <div className="glass rounded-2xl p-4">
              <div className="text-xs text-text-secondary mb-1">Mevcut Hamle</div>
              <div className="text-lg font-bold">
                {currentMove.move_type === 'stone' && currentMove.x != null
                  ? `${COLUMN_LABELS[currentMove.x]}${(currentMove.y ?? 0) + 1}`
                  : currentMove.move_type === 'pass' ? 'Pas' : 'Çekilme'}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${currentMove.player === 'black' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                <span className="text-sm text-text-secondary">
                  {currentMove.player === 'black' ? 'Siyah' : 'Beyaz'}
                </span>
                {currentMove.captured_stones.length > 0 && (
                  <span className="text-xs text-error">+{currentMove.captured_stones.length} yakalanan</span>
                )}
              </div>
            </div>
          )}

          <div className="glass rounded-2xl p-4 max-h-60 overflow-y-auto scrollbar-thin">
            <div className="text-sm font-medium text-text-secondary mb-2">Hamle Listesi</div>
            <div className="space-y-0.5">
              {moveHistory.map((record, idx) => {
                const col = record.x != null ? COLUMN_LABELS[record.x] : '';
                const row = record.y != null ? (record.y + 1) : '';
                const moveStr = record.move_type === 'stone' ? `${col}${row}` : record.move_type === 'pass' ? 'Pas' : 'Çekil';
                return (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setIsPlaying(false); }}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all ${
                      idx === currentIndex ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:bg-bg-primary/40'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${record.player === 'black' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    <span className="font-mono">{idx + 1}. {moveStr}</span>
                    {record.captured_stones.length > 0 && (
                      <span className="text-error ml-auto">+{record.captured_stones.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function createEmptyBoard(size: number): (StoneColor | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

function ScoreGraph({ points, currentIndex, onPointClick }: { points: ScoreHistoryPoint[]; currentIndex: number; onPointClick: (idx: number) => void }) {
  if (points.length < 2) return null;

  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 25, left: 35 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxMove = points[points.length - 1].move_number;
  const scores = points.map(p => p.score_mean);
  const minScore = Math.min(...scores, -5);
  const maxScore = Math.max(...scores, 5);
  const scoreRange = maxScore - minScore || 1;

  const toX = (move: number) => padding.left + (move / maxMove) * chartW;
  const toY = (score: number) => padding.top + chartH - ((score - minScore) / scoreRange) * chartH;

  const linePoints = points.map(p => `${toX(p.move_number)},${toY(p.score_mean)}`).join(' ');
  const zeroY = toY(0);

  // Y-axis ticks
  const yTicks = [Math.ceil(minScore), 0, Math.floor(maxScore)].filter((v, i, a) => a.indexOf(v) === i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ maxHeight: 140 }}>
      {/* Zero line */}
      <line x1={padding.left} y1={zeroY} x2={width - padding.right} y2={zeroY} stroke="rgba(148,163,184,0.3)" strokeWidth={1} strokeDasharray="4,3" />

      {/* Y-axis labels */}
      {yTicks.map(tick => (
        <text key={tick} x={padding.left - 5} y={toY(tick) + 3} textAnchor="end" fontSize={9} fill="#94a3b8" fontFamily="system-ui, sans-serif">
          {tick > 0 ? `+${tick}` : tick}
        </text>
      ))}

      {/* X-axis labels */}
      {points.filter((_, i) => i % Math.max(1, Math.floor(points.length / 6)) === 0 || i === points.length - 1).map(p => (
        <text key={p.move_number} x={toX(p.move_number)} y={height - 3} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="system-ui, sans-serif">
          {p.move_number}
        </text>
      ))}

      {/* Line */}
      <polyline points={linePoints} fill="none" stroke="#f59e0b" strokeWidth={2} strokeLinejoin="round" />

      {/* Area fill */}
      <polygon
        points={`${toX(points[0].move_number)},${zeroY} ${linePoints} ${toX(points[points.length - 1].move_number)},${zeroY}`}
        fill="url(#score-gradient)"
        opacity={0.3}
      />

      <defs>
        <linearGradient id="score-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* Clickable points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={toX(p.move_number)}
          cy={toY(p.score_mean)}
          r={p.move_number === currentIndex + 1 ? 4 : 2.5}
          fill={p.score_mean > 0.5 ? '#22c55e' : p.score_mean < -0.5 ? '#ef4444' : '#f59e0b'}
          stroke={p.move_number === currentIndex + 1 ? '#fff' : 'none'}
          strokeWidth={1.5}
          className="cursor-pointer"
          onClick={() => onPointClick(p.move_number)}
        >
          <title>{`Hamle ${p.move_number}: ${p.score_mean > 0 ? '+' : ''}${p.score_mean.toFixed(1)} | Kazanma: ${(p.win_rate * 100).toFixed(0)}%`}</title>
        </circle>
      ))}
    </svg>
  );
}
