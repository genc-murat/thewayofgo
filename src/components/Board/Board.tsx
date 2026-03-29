import React, { useMemo, useCallback, useState, useRef } from 'react';
import type { BoardSize, StoneColor, Point, Highlight, HeatmapEntry } from '../../types';

interface BoardProps {
  size: BoardSize;
  board: (StoneColor | null)[][];
  lastMove?: Point | null;
  highlights?: Highlight[];
  heatmap?: HeatmapEntry[];
  ownership?: number[][] | null;
  variation?: Point[];
  validMoves?: Point[];
  showValidMoves?: boolean;
  onIntersectionClick?: (x: number, y: number) => void;
  interactive?: boolean;
  showCoordinates?: boolean;
  className?: string;
  currentPlayer?: StoneColor;
  animateStones?: boolean;
}

export function Board({
  size,
  board,
  lastMove,
  highlights = [],
  heatmap = [],
  ownership = null,
  variation = [],
  validMoves = [],
  showValidMoves = false,
  onIntersectionClick,
  interactive = false,
  showCoordinates = true,
  className = '',
  currentPlayer = 'black',
  animateStones = true,
}: BoardProps) {
  const cellSize = 32;
  const padding = showCoordinates ? 32 : 16;
  const stoneRadius = cellSize * 0.46;
  const boardPixels = cellSize * (size - 1) + padding * 2;

  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  const prevBoardRef = useRef<string>('');

  const boardHash = useMemo(() => {
    return board.map(row => row.map(c => c ?? '.').join('')).join('');
  }, [board]);

  const newStones = useMemo(() => {
    if (!animateStones) return new Set<string>();
    const prev = prevBoardRef.current;
    const stones = new Set<string>();
    if (prev && prev !== boardHash) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const idx = y * size + x;
          const oldChar = prev[idx] ?? '.';
          const newChar = boardHash[idx] ?? '.';
          if (oldChar === '.' && newChar !== '.') {
            stones.add(`${x},${y}`);
          }
        }
      }
    }
    prevBoardRef.current = boardHash;
    return stones;
  }, [boardHash, size, animateStones]);

  const validMoveSet = useMemo(() => {
    if (!showValidMoves) return null;
    const set = new Set<string>();
    for (const m of validMoves) set.add(`${m.x},${m.y}`);
    return set;
  }, [showValidMoves, validMoves]);

  const starPoints = useMemo(() => {
    if (size === 9) return [[2, 2], [6, 2], [4, 4], [2, 6], [6, 6]];
    if (size === 13) return [[3, 3], [9, 3], [6, 6], [3, 9], [9, 9]];
    return [[3, 3], [9, 3], [15, 3], [3, 9], [9, 9], [15, 9], [3, 15], [9, 15], [15, 15]];
  }, [size]);

  const coordLabels = useMemo(() => {
    const letters = 'ABCDEFGHJKLMNOPQRST';
    return Array.from({ length: size }, (_, i) => letters[i]);
  }, [size]);

  const toPixel = useCallback((coord: number) => padding + coord * cellSize, [padding, cellSize]);

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!interactive || !onIntersectionClick) return;
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = boardPixels / rect.width;
      const scaleY = boardPixels / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const gridX = Math.round((x - padding) / cellSize);
      const gridY = Math.round((y - padding) / cellSize);
      if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
        onIntersectionClick(gridX, gridY);
      }
    },
    [interactive, onIntersectionClick, boardPixels, padding, cellSize, size]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGElement>) => {
      if (!interactive) { setHoverPoint(null); return; }
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      const scaleX = boardPixels / rect.width;
      const scaleY = boardPixels / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const gridX = Math.round((x - padding) / cellSize);
      const gridY = Math.round((y - padding) / cellSize);
      if (gridX >= 0 && gridX < size && gridY >= 0 && gridY < size) {
        setHoverPoint({ x: gridX, y: gridY });
      } else {
        setHoverPoint(null);
      }
    },
    [interactive, boardPixels, padding, cellSize, size]
  );

  const handleMouseLeave = useCallback(() => setHoverPoint(null), []);

  return (
    <svg
      viewBox={`0 0 ${boardPixels} ${boardPixels}`}
      width={boardPixels}
      height={boardPixels}
      className={`rounded-lg ${className}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: interactive ? 'pointer' : 'default', maxWidth: '100%', height: 'auto' }}
    >
      <defs>
        <linearGradient id="wood-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8c860" />
          <stop offset="25%" stopColor="#dcb35c" />
          <stop offset="50%" stopColor="#d4a840" />
          <stop offset="75%" stopColor="#dcb35c" />
          <stop offset="100%" stopColor="#e0b850" />
        </linearGradient>

        <radialGradient id="stone-black-grad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#4a4a4a" />
          <stop offset="40%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>

        <radialGradient id="stone-white-grad" cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#d4d4d4" />
        </radialGradient>

        <radialGradient id="stone-black-shine" cx="30%" cy="25%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        <radialGradient id="stone-white-shine" cx="30%" cy="25%" r="25%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        <filter id="stone-shadow">
          <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="rgba(0,0,0,0.35)" />
        </filter>
      </defs>

      <rect x={0} y={0} width={boardPixels} height={boardPixels} fill="url(#wood-bg)" rx={6} />

      {Array.from({ length: size }).map((_, i) => (
        <g key={`lines-${i}`}>
          <line x1={toPixel(0)} y1={toPixel(i)} x2={toPixel(size - 1)} y2={toPixel(i)} stroke="#5a3e1b" strokeWidth={1} />
          <line x1={toPixel(i)} y1={toPixel(0)} x2={toPixel(i)} y2={toPixel(size - 1)} stroke="#5a3e1b" strokeWidth={1} />
        </g>
      ))}

      {showCoordinates && (
        <>
          {coordLabels.map((label, i) => (
            <React.Fragment key={`coord-${i}`}>
              <text x={toPixel(i)} y={padding - 10} textAnchor="middle" fontSize={10} fill="#5a3e1b" fontFamily="system-ui, sans-serif" fontWeight={600}>{label}</text>
              <text x={padding - 12} y={toPixel(i) + 4} textAnchor="middle" fontSize={10} fill="#5a3e1b" fontFamily="system-ui, sans-serif" fontWeight={600}>{size - i}</text>
            </React.Fragment>
          ))}
        </>
      )}

      {starPoints.map(([x, y]) => (
        <circle key={`star-${x}-${y}`} cx={toPixel(x)} cy={toPixel(y)} r={3.5} fill="#5a3e1b" />
      ))}

      {/* Valid move indicators */}
      {validMoveSet && board.map((row, y) =>
        row.map((cell, x) => {
          if (cell) return null;
          if (!validMoveSet.has(`${x},${y}`)) return null;
          return (
            <circle
              key={`valid-${x}-${y}`}
              cx={toPixel(x)}
              cy={toPixel(y)}
              r={4}
              fill="rgba(245, 158, 11, 0.35)"
              stroke="rgba(245, 158, 11, 0.5)"
              strokeWidth={1}
            />
          );
        })
      )}

      {highlights.map((h, i) => {
        const colorMap: Record<string, string> = {
          liberty: '#22c55e', capture: '#ef4444', territory: '#3b82f6', good: '#22c55e', bad: '#ef4444',
        };
        return (
          <circle
            key={`highlight-${i}`}
            cx={toPixel(h.x)}
            cy={toPixel(h.y)}
            r={stoneRadius * 0.6}
            fill={colorMap[h.type]}
            opacity={0.5}
          />
        );
      })}

      {/* KataGo heatmap overlay — top 5 moves */}
      {heatmap.length > 0 && heatmap.map((entry, i) => {
        if (entry.x >= size || entry.y >= size) return null;
        const wr = Math.max(0, Math.min(1, entry.win_rate));
        const r = Math.round(255 * (1 - wr));
        const g = Math.round(200 * wr + 40);
        const b = 30;
        const isTop = entry.rank <= 5;
        const opacity = entry.is_best ? 0.65 : isTop ? 0.5 : 0.3;
        const halfCell = cellSize / 2;
        const px = toPixel(entry.x);
        const py = toPixel(entry.y);
        const fontSize = cellSize * 0.32;
        const scoreStr = entry.score_mean >= 0 ? `+${entry.score_mean.toFixed(1)}` : entry.score_mean.toFixed(1);
        const wrPct = (wr * 100).toFixed(0);

        return (
          <g key={`heatmap-${entry.x}-${entry.y}-${i}`}>
            <rect
              x={px - halfCell}
              y={py - halfCell}
              width={cellSize}
              height={cellSize}
              fill={`rgb(${r},${g},${b})`}
              opacity={opacity}
              rx={3}
            />
            {isTop && (
              <>
                {/* Rank badge */}
                <circle
                  cx={px - halfCell * 0.55}
                  cy={py - halfCell * 0.55}
                  r={cellSize * 0.2}
                  fill={entry.is_best ? '#f59e0b' : '#1e293b'}
                  stroke="#fff"
                  strokeWidth={0.8}
                />
                <text
                  x={px - halfCell * 0.55}
                  y={py - halfCell * 0.55 + fontSize * 0.35}
                  textAnchor="middle"
                  fontSize={fontSize * 0.8}
                  fill="#fff"
                  fontFamily="system-ui, sans-serif"
                  fontWeight={700}
                >
                  {entry.rank}
                </text>
                {/* Win rate % */}
                <text
                  x={px}
                  y={py + fontSize * 0.2}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fill="#fff"
                  fontFamily="system-ui, sans-serif"
                  fontWeight={700}
                  stroke="#000"
                  strokeWidth={0.5}
                  paintOrder="stroke"
                >
                  {wrPct}%
                </text>
                {/* Score */}
                <text
                  x={px}
                  y={py + fontSize * 1.1}
                  textAnchor="middle"
                  fontSize={fontSize * 0.7}
                  fill="#fff"
                  fontFamily="system-ui, sans-serif"
                  fontWeight={600}
                  stroke="#000"
                  strokeWidth={0.4}
                  paintOrder="stroke"
                >
                  {scoreStr}
                </text>
                {/* Tooltip title for hover */}
                <title>{`#${entry.rank} ${entry.score_mean >= 0 ? 'S' : 'B'} ${Math.abs(entry.score_mean).toFixed(1)} | %${wrPct} kazanma | ${entry.visits} ziyaret`}</title>
              </>
            )}
            {!isTop && (
              <title>{`%${wrPct} kazanma | ${scoreStr} | ${entry.visits} ziyaret`}</title>
            )}
          </g>
        );
      })}

      {/* Ownership overlay */}
      {ownership && ownership.length === size && board.map((row, y) =>
        row.map((cell, x) => {
          if (cell) return null; // Skip intersections with stones
          if (!ownership[y] || ownership[y][x] === undefined) return null;
          const val = ownership[y][x]; // -1.0 (white) to +1.0 (black)
          const absVal = Math.abs(val);
          if (absVal < 0.1) return null; // Skip neutral
          const isBlack = val > 0;
          const color = isBlack ? 'rgba(0,0,0,' : 'rgba(255,255,255,';
          const opacity = absVal * 0.45;
          return (
            <rect
              key={`own-${x}-${y}`}
              x={toPixel(x) - cellSize / 2 + 1}
              y={toPixel(y) - cellSize / 2 + 1}
              width={cellSize - 2}
              height={cellSize - 2}
              fill={`${color}${opacity})`}
              rx={2}
            />
          );
        })
      )}

      {/* Variation overlay */}
      {variation.length > 0 && variation.map((pt, i) => {
        if (pt.x >= size || pt.y >= size) return null;
        const px = toPixel(pt.x);
        const py = toPixel(pt.y);
        const isEven = i % 2 === 0;
        const stoneColor = isEven ? '#ef4444' : '#3b82f6';
        const r = cellSize * 0.22;
        return (
          <g key={`var-${i}`}>
            {i > 0 && (
              <line
                x1={toPixel(variation[i - 1].x)}
                y1={toPixel(variation[i - 1].y)}
                x2={px}
                y2={py}
                stroke={stoneColor}
                strokeWidth={1.5}
                strokeDasharray="4,3"
                opacity={0.6}
              />
            )}
            <circle cx={px} cy={py} r={r} fill={stoneColor} opacity={0.8} />
            <text
              x={px}
              y={py + r * 0.38}
              textAnchor="middle"
              fontSize={r * 1.1}
              fill="#fff"
              fontFamily="system-ui, sans-serif"
              fontWeight={700}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {board.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          const isLast = lastMove?.x === x && lastMove?.y === y;
          const isNew = newStones.has(`${x},${y}`);
          return (
            <g key={`stone-${x}-${y}`} filter="url(#stone-shadow)" className={isNew ? 'animate-stone-place' : ''}>
              <circle cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius} fill={cell === 'black' ? 'url(#stone-black-grad)' : 'url(#stone-white-grad)'} />
              <circle cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius} fill={cell === 'black' ? 'url(#stone-black-shine)' : 'url(#stone-white-shine)'} />
              {isLast && (
                <circle
                  cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius * 0.32}
                  fill="none" stroke="#f59e0b" strokeWidth={2}
                  opacity={0.9}
                />
              )}
            </g>
          );
        })
      )}

      {interactive && hoverPoint && !board[hoverPoint.y]?.[hoverPoint.x] && (
        <circle
          cx={toPixel(hoverPoint.x)} cy={toPixel(hoverPoint.y)} r={stoneRadius}
          fill={currentPlayer === 'black' ? 'rgba(26, 26, 26, 0.3)' : 'rgba(255, 255, 255, 0.5)'}
          stroke={currentPlayer === 'black' ? 'rgba(26, 26, 26, 0.5)' : 'rgba(200, 200, 200, 0.7)'}
          strokeWidth={1}
        />
      )}
    </svg>
  );
}
