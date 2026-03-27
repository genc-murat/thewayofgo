import type { StoneColor } from '../types';

export function createBoardFromStones(
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
