import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  return db;
}

export interface SRSCard {
  card_id: string;
  exercise_type: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review: string;
  last_review: string | null;
  lapses: number;
}

export interface SRSStats {
  total_cards: number;
  due_today: number;
  learned: number;
  learning: number;
  lapsed: number;
}

export async function getNextReviewCards(limit: number = 20): Promise<SRSCard[]> {
  const database = await getDb();
  try {
    const now = new Date().toISOString();
    const results = await database.select<SRSCard[]>(
      `SELECT card_id, exercise_type, ease_factor, interval_days, repetitions, next_review, last_review, lapses
       FROM srs_cards
       WHERE next_review <= $1
       ORDER BY next_review ASC
       LIMIT $2`,
      [now, limit]
    );
    return results;
  } catch (err) {
    console.warn('[srs] getNextReviewCards failed:', err);
    return [];
  }
}

export async function recordSRSCardResult(cardId: string, correct: boolean): Promise<void> {
  const database = await getDb();
  try {
    const existing = await database.select<SRSCard[]>(
      `SELECT card_id, exercise_type, ease_factor, interval_days, repetitions, next_review, last_review, lapses
       FROM srs_cards WHERE card_id = $1`,
      [cardId]
    );

    if (existing.length === 0) return;

    const card = existing[0];
    let { ease_factor, interval_days, repetitions, lapses } = card;

    if (correct) {
      repetitions += 1;
      if (repetitions === 1) {
        interval_days = 1;
      } else if (repetitions === 2) {
        interval_days = 6;
      } else {
        interval_days = interval_days * ease_factor;
      }
      ease_factor = Math.max(1.3, ease_factor + 0.1);
    } else {
      repetitions = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
      lapses += 1;
    }

    const now = new Date();
    const nextReview = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);

    await database.execute(
      `UPDATE srs_cards
       SET ease_factor = $1, interval_days = $2, repetitions = $3,
           next_review = $4, last_review = $5, lapses = $6
       WHERE card_id = $7`,
      [ease_factor, interval_days, repetitions, nextReview.toISOString(), now.toISOString(), lapses, cardId]
    );
  } catch (err) {
    console.warn('[srs] recordSRSCardResult failed:', err);
  }
}

export async function getSRSStats(): Promise<SRSStats> {
  const database = await getDb();
  try {
    const now = new Date().toISOString();

    const totalResult = await database.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM srs_cards'
    );

    const dueResult = await database.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM srs_cards WHERE next_review <= $1',
      [now]
    );

    const learnedResult = await database.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM srs_cards WHERE repetitions >= 3'
    );

    const lapsedResult = await database.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM srs_cards WHERE lapses > 0'
    );

    const total = totalResult[0]?.count ?? 0;
    const learned = learnedResult[0]?.count ?? 0;
    const lapsed = lapsedResult[0]?.count ?? 0;

    return {
      total_cards: total,
      due_today: dueResult[0]?.count ?? 0,
      learned,
      learning: total - learned,
      lapsed,
    };
  } catch (err) {
    console.warn('[srs] getSRSStats failed:', err);
    return { total_cards: 0, due_today: 0, learned: 0, learning: 0, lapsed: 0 };
  }
}

export async function syncExerciseToSRS(exerciseId: string, exerciseType: string): Promise<void> {
  const database = await getDb();
  try {
    const existing = await database.select<{ card_id: string }[]>(
      'SELECT card_id FROM srs_cards WHERE card_id = $1',
      [exerciseId]
    );

    if (existing.length === 0) {
      const now = new Date();
      const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      await database.execute(
        `INSERT INTO srs_cards (card_id, exercise_type, ease_factor, interval_days, repetitions, next_review, last_review, lapses)
         VALUES ($1, $2, 2.5, 0, 0, $3, NULL, 0)`,
        [exerciseId, exerciseType, nextReview.toISOString()]
      );
    }
  } catch (err) {
    console.warn('[srs] syncExerciseToSRS failed:', err);
  }
}

export async function getSRSCardInfo(cardId: string): Promise<SRSCard | null> {
  const database = await getDb();
  try {
    const results = await database.select<SRSCard[]>(
      `SELECT card_id, exercise_type, ease_factor, interval_days, repetitions, next_review, last_review, lapses
       FROM srs_cards WHERE card_id = $1`,
      [cardId]
    );
    return results[0] ?? null;
  } catch (err) {
    console.warn('[srs] getSRSCardInfo failed:', err);
    return null;
  }
}
