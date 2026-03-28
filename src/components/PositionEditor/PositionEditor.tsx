import { useState, useCallback } from 'react';
import { Board } from '../Board';
import { useAppStore } from '../../stores/appStore';
import type { BoardSize, StoneColor } from '../../types';

type EditorTool = 'black' | 'white' | 'erase';

export function PositionEditor() {
  const { setView, createGameFromPosition } = useAppStore();
  const [boardSize, setBoardSize] = useState<BoardSize>(9);
  const [board, setBoard] = useState<(StoneColor | null)[][]>(
    Array.from({ length: 9 }, () => Array(9).fill(null))
  );
  const [tool, setTool] = useState<EditorTool>('black');
  const [currentPlayer, setCurrentPlayer] = useState<StoneColor>('black');
  const [komi, setKomi] = useState(6.5);
  const [blackCaptures, setBlackCaptures] = useState(0);
  const [whiteCaptures, setWhiteCaptures] = useState(0);

  const handleBoardSizeChange = useCallback((size: BoardSize) => {
    setBoardSize(size);
    setBoard(Array.from({ length: size }, () => Array(size).fill(null)));
  }, []);

  const handleIntersectionClick = useCallback((x: number, y: number) => {
    setBoard(prev => {
      const next = prev.map(row => [...row]);
      if (tool === 'erase') {
        next[y][x] = null;
      } else {
        next[y][x] = tool;
      }
      return next;
    });
  }, [tool]);

  const handleClear = useCallback(() => {
    setBoard(Array.from({ length: boardSize }, () => Array(boardSize).fill(null)));
  }, [boardSize]);

  const handleStartGame = useCallback(() => {
    const stones: { x: number; y: number; color: StoneColor }[] = [];
    for (let y = 0; y < boardSize; y++) {
      for (let x = 0; x < boardSize; x++) {
        if (board[y][x]) {
          stones.push({ x, y, color: board[y][x]! });
        }
      }
    }
    createGameFromPosition(boardSize, stones, currentPlayer, komi, blackCaptures, whiteCaptures);
  }, [board, boardSize, currentPlayer, komi, blackCaptures, whiteCaptures, createGameFromPosition]);

  const stoneCount = board.flat().filter(c => c !== null).length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4">
      {/* Board */}
      <div className="flex-shrink-0">
        <Board
          size={boardSize}
          board={board}
          onIntersectionClick={handleIntersectionClick}
          interactive={true}
          showCoordinates={true}
        />
      </div>

      {/* Tool Panel */}
      <div className="flex flex-col gap-4 w-full lg:w-72">
        <div className="glass rounded-2xl p-5">
          <h3 className="text-lg font-bold mb-4">Pozisyon Editörü</h3>

          {/* Stone count */}
          <div className="text-sm text-text-secondary mb-4">
            {stoneCount} taş yerleştirildi
          </div>

          {/* Tool selection */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Araç</label>
            <div className="flex gap-2">
              {([
                { value: 'black' as EditorTool, label: 'Siyah', color: 'bg-gray-900' },
                { value: 'white' as EditorTool, label: 'Beyaz', color: 'bg-white border border-gray-300' },
                { value: 'erase' as EditorTool, label: 'Sil', color: 'bg-red-500/20 border border-red-500/30' },
              ]).map(t => (
                <button
                  key={t.value}
                  onClick={() => setTool(t.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    tool === t.value
                      ? 'ring-2 ring-accent bg-accent/10'
                      : 'hover:bg-bg-primary/50'
                  }`}
                >
                  <span className={`inline-block w-3 h-3 rounded-full ${t.color} mr-1.5 align-middle`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current player */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Sıra</label>
            <div className="flex gap-2">
              {(['black', 'white'] as StoneColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => setCurrentPlayer(color)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    currentPlayer === color
                      ? 'ring-2 ring-accent bg-accent/10'
                      : 'hover:bg-bg-primary/50'
                  }`}
                >
                  {color === 'black' ? 'Siyah oynar' : 'Beyaz oynar'}
                </button>
              ))}
            </div>
          </div>

          {/* Board size */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Tahta Boyutu</label>
            <div className="flex gap-2">
              {([9, 13, 19] as BoardSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => handleBoardSizeChange(size)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    boardSize === size
                      ? 'ring-2 ring-accent bg-accent/10'
                      : 'hover:bg-bg-primary/50'
                  }`}
                >
                  {size}x{size}
                </button>
              ))}
            </div>
          </div>

          {/* Komi */}
          <div className="mb-4">
            <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2 block">Komi</label>
            <input
              type="number"
              value={komi}
              onChange={e => setKomi(parseFloat(e.target.value) || 0)}
              step={0.5}
              min={0}
              max={100}
              className="w-full bg-bg-primary/50 rounded-lg px-3 py-2 text-sm border border-glass-border focus:border-accent outline-none"
            />
          </div>

          {/* Captures */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1 block">Siyah yak.</label>
              <input
                type="number"
                value={blackCaptures}
                onChange={e => setBlackCaptures(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                className="w-full bg-bg-primary/50 rounded-lg px-3 py-2 text-sm border border-glass-border focus:border-accent outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1 block">Beyaz yak.</label>
              <input
                type="number"
                value={whiteCaptures}
                onChange={e => setWhiteCaptures(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                className="w-full bg-bg-primary/50 rounded-lg px-3 py-2 text-sm border border-glass-border focus:border-accent outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleStartGame}
              disabled={stoneCount === 0}
              className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Oyuna Başla
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary w-full py-2.5 rounded-xl text-sm font-medium"
            >
              Temizle
            </button>
            <button
              onClick={() => setView('home')}
              className="text-text-secondary text-sm py-2 hover:text-text-primary transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
