import React, { useMemo, useCallback } from 'react';
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

const BOARD_COLORS = {
  wood: '#dcb35c',
  woodDark: '#c9a234',
  line: '#1a1a1a',
  starPoint: '#1a1a1a',
};

const STONE_COLORS = {
  black: '#1a1a1a',
  white: '#f0f0f0',
  blackStroke: '#000000',
  whiteStroke: '#cccccc',
};

const HIGHLIGHT_COLORS = {
  liberty: '#22c55e',
  capture: '#ef4444',
  territory: '#3b82f6',
  good: '#22c55e',
  bad: '#ef4444',
};

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
  const cellSize = 30;
  const padding = showCoordinates ? 30 : 15;
  const stoneRadius = cellSize * 0.45;
  const boardPixels = cellSize * (size - 1) + padding * 2;

  const starPoints = useMemo(() => {
    if (size === 9) {
      return [
        [2, 2], [6, 2], [4, 4],
        [2, 6], [6, 6],
      ];
    } else if (size === 13) {
      return [
        [3, 3], [9, 3], [6, 6],
        [3, 9], [9, 9],
      ];
    } else {
      return [
        [3, 3], [9, 3], [15, 3],
        [3, 9], [9, 9], [15, 9],
        [3, 15], [9, 15], [15, 15],
      ];
    }
  }, [size]);

  const coordLabels = useMemo(() => {
    const labels: string[] = [];
    const letters = 'ABCDEFGHJKLMNOPQRST';
    for (let i = 0; i < size; i++) {
      labels.push(letters[i]);
    }
    return labels;
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

  return (
    <svg
      viewBox={`0 0 ${boardPixels} ${boardPixels}`}
      className={`max-w-full max-h-full ${className}`}
      onClick={handleClick}
      style={{ cursor: interactive ? 'pointer' : 'default' }}
    >
      {/* Board background */}
      <rect
        x={0}
        y={0}
        width={boardPixels}
        height={boardPixels}
        fill={BOARD_COLORS.wood}
        rx={4}
      />

      {/* Grid lines */}
      {Array.from({ length: size }).map((_, i) => (
        <g key={`lines-${i}`}>
          <line
            x1={toPixel(0)}
            y1={toPixel(i)}
            x2={toPixel(size - 1)}
            y2={toPixel(i)}
            stroke={BOARD_COLORS.line}
            strokeWidth={1}
          />
          <line
            x1={toPixel(i)}
            y1={toPixel(0)}
            x2={toPixel(i)}
            y2={toPixel(size - 1)}
            stroke={BOARD_COLORS.line}
            strokeWidth={1}
          />
        </g>
      ))}

      {/* Coordinate labels */}
      {showCoordinates && (
        <>
          {coordLabels.map((label, i) => (
            <React.Fragment key={`coord-${i}`}>
              <text
                x={toPixel(i)}
                y={padding - 10}
                textAnchor="middle"
                fontSize={10}
                fill={BOARD_COLORS.line}
                fontFamily="monospace"
              >
                {label}
              </text>
              <text
                x={padding - 12}
                y={toPixel(i) + 4}
                textAnchor="middle"
                fontSize={10}
                fill={BOARD_COLORS.line}
                fontFamily="monospace"
              >
                {size - i}
              </text>
            </React.Fragment>
          ))}
        </>
      )}

      {/* Star points */}
      {starPoints.map(([x, y]) => (
        <circle
          key={`star-${x}-${y}`}
          cx={toPixel(x)}
          cy={toPixel(y)}
          r={3}
          fill={BOARD_COLORS.starPoint}
        />
      ))}

      {/* Highlights */}
      {highlights.map((h, i) => (
        <circle
          key={`highlight-${i}`}
          cx={toPixel(h.x)}
          cy={toPixel(h.y)}
          r={stoneRadius * 0.6}
          fill={HIGHLIGHT_COLORS[h.type]}
          opacity={0.5}
        />
      ))}

      {/* Valid move indicators */}
      {interactive &&
        validMoves.map((m) => (
          <circle
            key={`valid-${m.x}-${m.y}`}
            cx={toPixel(m.x)}
            cy={toPixel(m.y)}
            r={stoneRadius * 0.3}
            fill="#888888"
            opacity={0.0}
            className="transition-opacity"
          >
            <title>Valid move</title>
          </circle>
        ))}

      {/* Stones */}
      {board.map((row, y) =>
        row.map((cell, x) => {
          if (!cell) return null;
          const isLast = lastMove?.x === x && lastMove?.y === y;

          return (
            <g key={`stone-${x}-${y}`}>
              {/* Stone shadow */}
              <circle
                cx={toPixel(x) + 1}
                cy={toPixel(y) + 2}
                r={stoneRadius}
                fill="rgba(0,0,0,0.3)"
              />
              {/* Stone body */}
              <circle
                cx={toPixel(x)}
                cy={toPixel(y)}
                r={stoneRadius}
                fill={cell === 'black' ? STONE_COLORS.black : STONE_COLORS.white}
                stroke={cell === 'black' ? STONE_COLORS.blackStroke : STONE_COLORS.whiteStroke}
                strokeWidth={0.5}
              />
              {/* Stone gradient effect */}
              {cell === 'white' && (
                <circle
                  cx={toPixel(x) - stoneRadius * 0.2}
                  cy={toPixel(y) - stoneRadius * 0.2}
                  r={stoneRadius * 0.4}
                  fill="rgba(255,255,255,0.4)"
                />
              )}
              {/* Last move indicator */}
              {isLast && (
                <circle
                  cx={toPixel(x)}
                  cy={toPixel(y)}
                  r={stoneRadius * 0.35}
                  fill="none"
                  stroke={cell === 'black' ? '#ffffff' : '#000000'}
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })
      )}

      {/* Hover indicator for interactive mode */}
      {interactive && (
        <style>{`
          svg:hover .hover-indicator { opacity: 0.3; }
        `}</style>
      )}
    </svg>
  );
}
