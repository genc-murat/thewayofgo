import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  return db;
}

export interface SavedGame {
  id: number;
  board_size: number;
  opponent: string;
  result: string;
  moves: number;
  duration_seconds: number;
  played_at: string;
  board_state?: string;
  move_history?: string;
}

export async function saveGame(
  boardSize: number,
  opponent: string,
  result: string,
  moves: number,
  durationSeconds: number,
  _boardState?: string,
  _moveHistory?: string
): Promise<number | null> {
  const database = await getDb();
  try {
    await database.execute(
      `INSERT INTO game_history (board_size, opponent, result, moves, duration_seconds, played_at)
       VALUES ($1, $2, $3, $4, $5, datetime('now'))`,
      [boardSize, opponent, result, moves, durationSeconds]
    );

    // Get the last inserted row id
    const rows = await database.select<{ id: number }[]>(
      'SELECT MAX(id) as id FROM game_history'
    );
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function getSavedGames(limit: number = 10): Promise<SavedGame[]> {
  const database = await getDb();
  try {
    const rows = await database.select<SavedGame[]>(
      `SELECT id, board_size, opponent, result, moves, duration_seconds, played_at
       FROM game_history
       ORDER BY played_at DESC
       LIMIT $1`,
      [limit]
    );
    return rows;
  } catch {
    return [];
  }
}

export async function getSavedGame(id: number): Promise<SavedGame | null> {
  const database = await getDb();
  try {
    const rows = await database.select<SavedGame[]>(
      'SELECT * FROM game_history WHERE id = $1',
      [id]
    );
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function deleteSavedGame(id: number): Promise<boolean> {
  const database = await getDb();
  try {
    await database.execute('DELETE FROM game_history WHERE id = $1', [id]);
    return true;
  } catch {
    return false;
  }
}

export function formatGameResult(result: string): string {
  switch (result) {
    case 'black_wins': return 'Siyah Kazandı';
    case 'white_wins': return 'Beyaz Kazandı';
    case 'resign_black': return 'Siyah Çekildi';
    case 'resign_white': return 'Beyaz Çekildi';
    case 'draw': return 'Berabere';
    case 'in_progress': return 'Devam Ediyor';
    default: return result;
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sn`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} dk`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours} sa ${mins} dk`;
}
