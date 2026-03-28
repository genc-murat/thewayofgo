export interface StudySession {
  startTime: number;
  exercisesCompleted: number;
  lessonsCompleted: number;
  correctAnswers: number;
  totalAnswers: number;
  isActive: boolean;
}

let currentSession: StudySession | null = null;

export function startSession(): StudySession {
  currentSession = {
    startTime: Date.now(),
    exercisesCompleted: 0,
    lessonsCompleted: 0,
    correctAnswers: 0,
    totalAnswers: 0,
    isActive: true,
  };
  return currentSession;
}

export function endSession(): StudySession | null {
  if (!currentSession) return null;
  currentSession.isActive = false;
  const session = { ...currentSession };
  currentSession = null;
  return session;
}

export function getSession(): StudySession | null {
  return currentSession;
}

export function recordExerciseInSession(correct: boolean): void {
  if (!currentSession) return;
  currentSession.exercisesCompleted += 1;
  currentSession.totalAnswers += 1;
  if (correct) currentSession.correctAnswers += 1;
}

export function recordLessonInSession(): void {
  if (!currentSession) return;
  currentSession.lessonsCompleted += 1;
}

export function getSessionDurationMinutes(): number {
  if (!currentSession) return 0;
  return Math.round((Date.now() - currentSession.startTime) / 60000);
}

export function shouldTakeBreak(): boolean {
  return getSessionDurationMinutes() >= 30;
}

export function getSessionSummary(): string {
  if (!currentSession) return 'Aktif oturum yok';
  const duration = getSessionDurationMinutes();
  const accuracy = currentSession.totalAnswers > 0
    ? Math.round((currentSession.correctAnswers / currentSession.totalAnswers) * 100)
    : 0;
  return `${duration} dk | ${currentSession.exercisesCompleted} alıştırma | ${currentSession.lessonsCompleted} ders | %${accuracy} doğruluk`;
}
