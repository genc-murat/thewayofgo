import React, { useMemo, useCallback, useState } from 'react';
import type { BoardSize, StoneColor, Point, Highlight } from '../../types';

interface BoardProps {
  size: BoardSize;
  board: (StoneColor | null)[][];
  lastMove?: Point | null;
  highlights?: Highlight[];
  validMoves?: Point[];
  onIntersectionClick?: (x: number, y: number) => void;
  interactive?: boolean;
  showCoordinates?: boolean;
  className?: string;
}

export function Board({
  size,
  board,
  lastMove,
  highlights = [],
  validMoves = [],
  onIntersectionClick,
  interactive = false,
  showCoordinates = true,
  className = '',
}: BoardProps) {
  const cellSize = 32;
  const padding = showCoordinates ? 32 : 16;
  const stoneRadius = cellSize * 0.46;
  const boardPixels = cellSize * (size - 1) + padding * 2;

  const [hoverPoint, setHoverPoint] = useState<Point | null>(null);
  void validMoves;

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

      {board.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          const isLast = lastMove?.x === x && lastMove?.y === y;
          return (
            <g key={`stone-${x}-${y}`} filter="url(#stone-shadow)">
              <circle cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius} fill={cell === 'black' ? 'url(#stone-black-grad)' : 'url(#stone-white-grad)'} />
              <circle cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius} fill={cell === 'black' ? 'url(#stone-black-shine)' : 'url(#stone-white-shine)'} />
              {isLast && (
                <circle
                  cx={toPixel(x)} cy={toPixel(y)} r={stoneRadius * 0.32}
                  fill="none" stroke={cell === 'black' ? '#f59e0b' : '#f59e0b'} strokeWidth={2}
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
          fill="rgba(26, 26, 26, 0.3)" stroke="rgba(26, 26, 26, 0.5)" strokeWidth={1}
        />
      )}
    </svg>
  );
}
