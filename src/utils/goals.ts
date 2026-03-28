import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load('sqlite:thewayofgo.db');
  }
  return db;
}

export type GoalType = 'daily_exercises' | 'weekly_lessons' | 'level_complete' | 'custom';

export interface Goal {
  id: number;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

export interface GoalCreateOptions {
  goal_type: GoalType;
  target_value: number;
  deadline?: string;
}

export async function createGoal(options: GoalCreateOptions): Promise<number | null> {
  const database = await getDb();
  try {
    const now = new Date().toISOString();
    await database.execute(
      `INSERT INTO goals (goal_type, target_value, current_value, deadline, completed, created_at)
       VALUES ($1, $2, 0, $3, 0, $4)`,
      [options.goal_type, options.target_value, options.deadline ?? null, now]
    );
    const rows = await database.select<{ id: number }[]>(
      'SELECT MAX(id) as id FROM goals'
    );
    return rows[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function getActiveGoals(): Promise<Goal[]> {
  const database = await getDb();
  try {
    const results = await database.select<Goal[]>(
      `SELECT id, goal_type, target_value, current_value, deadline, completed, created_at
       FROM goals WHERE completed = 0 ORDER BY created_at DESC`
    );
    return results;
  } catch {
    return [];
  }
}

export async function getCompletedGoals(): Promise<Goal[]> {
  const database = await getDb();
  try {
    const results = await database.select<Goal[]>(
      `SELECT id, goal_type, target_value, current_value, deadline, completed, created_at
       FROM goals WHERE completed = 1 ORDER BY created_at DESC LIMIT 10`
    );
    return results;
  } catch {
    return [];
  }
}

export async function updateGoalProgress(goalId: number, increment: number = 1): Promise<void> {
  const database = await getDb();
  try {
    const goals = await database.select<Goal[]>(
      'SELECT * FROM goals WHERE id = $1 AND completed = 0',
      [goalId]
    );
    if (goals.length === 0) return;

    const goal = goals[0];
    const newValue = goal.current_value + increment;
    const isComplete = newValue >= goal.target_value;

    await database.execute(
      `UPDATE goals SET current_value = $1, completed = $2 WHERE id = $3`,
      [newValue, isComplete ? 1 : 0, goalId]
    );
  } catch {
    // Non-critical
  }
}

export async function syncGoalsFromExercise(_correct: boolean): Promise<void> {
  try {
    const activeGoals = await getActiveGoals();
    for (const goal of activeGoals) {
      if (goal.goal_type === 'daily_exercises') {
        await updateGoalProgress(goal.id, 1);
      }
    }
  } catch {
    // Non-critical
  }
}

export async function getGoalProgress(goal: Goal): Promise<{ percentage: number; label: string }> {
  const pct = goal.target_value > 0
    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    : 0;

  const typeLabels: Record<GoalType, string> = {
    daily_exercises: 'Günlük Alıştırma',
    weekly_lessons: 'Haftalık Ders',
    level_complete: 'Seviye Tamamlama',
    custom: 'Özel Hedef',
  };

  return {
    percentage: pct,
    label: `${typeLabels[goal.goal_type]}: ${goal.current_value}/${goal.target_value}`,
  };
}

export async function initDefaultGoals(): Promise<void> {
  const database = await getDb();
  try {
    const existing = await database.select<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM goals'
    );
    if ((existing[0]?.count ?? 0) === 0) {
      await createGoal({ goal_type: 'daily_exercises', target_value: 5 });
      await createGoal({ goal_type: 'weekly_lessons', target_value: 7 });
    }
  } catch {
    // Non-critical
  }
}
