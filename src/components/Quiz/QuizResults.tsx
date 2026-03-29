import type { QuizQuestion } from '../../types';

interface QuizResultsProps {
  questions: QuizQuestion[];
  answers: (boolean | null)[];
  score: number;
  total: number;
  onRetry: () => void;
  onComplete: () => void;
}

export function QuizResults({ questions, answers, score, total, onRetry, onComplete }: QuizResultsProps) {
  const percentage = Math.round((score / total) * 100);
  const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 50 ? 1 : 0;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="glass rounded-3xl p-8 text-center mb-8">
        <div className="text-5xl mb-4">
          {stars >= 3 ? '🏆' : stars >= 2 ? '⭐' : stars >= 1 ? '👍' : '💪'}
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {percentage >= 90 ? 'Mükemmel!' : percentage >= 70 ? 'Güzel!' : percentage >= 50 ? 'İyi gidiyorsun!' : 'Tekrar dene!'}
        </h3>
        <p className="text-text-secondary mb-6">
          {score} / {total} doğru ({percentage}%)
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3].map(i => (
            <span key={i} className={`text-3xl ${i <= stars ? 'text-accent' : 'text-bg-card/50'}`}>
              ★
            </span>
          ))}
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onRetry} className="btn-secondary px-6 py-3 rounded-xl">
            Tekrar Dene
          </button>
          <button onClick={onComplete} className="btn-primary px-6 py-3 rounded-xl">
            Devam Et
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => {
          const isCorrect = answers[i];
          return (
            <div
              key={i}
              className={`glass rounded-2xl p-5 border ${isCorrect ? 'border-success/30' : 'border-error/30'}`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${isCorrect ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {isCorrect ? '✓' : '✗'}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-text-primary mb-1">
                    {q.type === 'multiple_choice' ? q.question : q.statement}
                  </p>
                  <p className="text-sm text-text-secondary">{q.explanation}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
