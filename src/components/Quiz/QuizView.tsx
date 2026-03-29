import { useState } from 'react';
import type { Quiz, QuizQuestion } from '../../types';
import { QuizResults } from './QuizResults';

interface QuizViewProps {
  quiz: Quiz;
  onComplete: () => void;
}

export function QuizView({ quiz, onComplete }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(boolean | null)[]>(new Array(quiz.questions.length).fill(null));
  const [showExplanation, setShowExplanation] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const score = answers.filter(a => a === true).length;

  const handleAnswer = (isCorrect: boolean) => {
    if (showExplanation) return;
    const newAnswers = [...answers];
    newAnswers[currentIndex] = isCorrect;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNext = () => {
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setAnswers(new Array(quiz.questions.length).fill(null));
    setShowExplanation(false);
    setShowResults(false);
  };

  if (showResults) {
    return (
      <QuizResults
        questions={quiz.questions}
        answers={answers}
        score={score}
        total={quiz.questions.length}
        onRetry={handleRetry}
        onComplete={onComplete}
      />
    );
  }

  const progress = ((currentIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-text-secondary">
            Mini Quiz — Soru {currentIndex + 1} / {quiz.questions.length}
          </span>
          <span className="text-sm text-accent font-medium">
            {score} doğru
          </span>
        </div>
        <div className="h-2 bg-bg-card/50 rounded-full overflow-hidden">
          <div className="h-full progress-bar-animated rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="glass rounded-2xl p-8 border border-accent/20 mb-6">
        <QuestionContent question={currentQuestion} onAnswer={handleAnswer} showExplanation={showExplanation} />
      </div>

      {showExplanation && (
        <div className="space-y-4 animate-fade-in-up">
          <div className={`rounded-2xl p-5 border ${answers[currentIndex] ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'}`}>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="font-bold text-lg">{answers[currentIndex] ? '✓ Doğru!' : '✗ Yanlış'}</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{currentQuestion.explanation}</p>
          </div>

          <button onClick={handleNext} className="btn-primary w-full py-3 rounded-xl">
            {currentIndex < quiz.questions.length - 1 ? 'Sonraki Soru →' : 'Sonuçları Gör'}
          </button>
        </div>
      )}
    </div>
  );
}

function QuestionContent({
  question,
  onAnswer,
  showExplanation,
}: {
  question: QuizQuestion;
  onAnswer: (correct: boolean) => void;
  showExplanation: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  if (question.type === 'multiple_choice') {
    return (
      <div>
        <h3 className="text-xl font-bold mb-6">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option, i) => {
            let btnClass = 'glass text-text-primary hover:border-accent/50';
            if (showExplanation && selected === i) {
              btnClass = i === question.correct_index
                ? 'bg-success/15 border-success/50 text-success'
                : 'bg-error/15 border-error/50 text-error';
            } else if (showExplanation && i === question.correct_index) {
              btnClass = 'bg-success/15 border-success/50 text-success';
            }

            return (
              <button
                key={i}
                onClick={() => {
                  if (!showExplanation) {
                    setSelected(i);
                    onAnswer(i === question.correct_index);
                  }
                }}
                disabled={showExplanation}
                className={`w-full text-left p-4 rounded-xl border transition-all ${btnClass}`}
              >
                <span className="font-medium">{String.fromCharCode(65 + i)})</span> {option}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-6">{question.statement}</h3>
      <p className="text-sm text-text-secondary mb-4">Doğru mu yoksa yanlış mı?</p>
      <div className="flex gap-4">
        {[
          { label: 'Doğru', value: true },
          { label: 'Yanlış', value: false },
        ].map(opt => {
          let btnClass = 'flex-1 py-4 rounded-xl font-semibold text-lg transition-all glass text-text-primary hover:border-accent/50';
          if (showExplanation && selected !== null) {
            const isSelected = selected === (opt.value ? 1 : 0);
            if (isSelected && opt.value === question.correct) {
              btnClass = 'flex-1 py-4 rounded-xl font-semibold text-lg bg-success/15 border-success/50 text-success';
            } else if (isSelected && opt.value !== question.correct) {
              btnClass = 'flex-1 py-4 rounded-xl font-semibold text-lg bg-error/15 border-error/50 text-error';
            } else if (opt.value === question.correct) {
              btnClass = 'flex-1 py-4 rounded-xl font-semibold text-lg bg-success/15 border-success/50 text-success';
            }
          }

          return (
            <button
              key={String(opt.value)}
              onClick={() => {
                if (!showExplanation) {
                  setSelected(opt.value ? 1 : 0);
                  onAnswer(opt.value === question.correct);
                }
              }}
              disabled={showExplanation}
              className={btnClass}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
