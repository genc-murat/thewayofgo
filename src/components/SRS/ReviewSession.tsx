import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, Highlight } from '../../types';
import { getNextReviewCards, recordSRSCardResult, type SRSCard } from '../../utils/srs';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { Exercise } from '../../types';

interface SessionStats {
  total: number;
  correct: number;
  incorrect: number;
}

export function ReviewSession() {
  const { setView } = useAppStore();
  const [cards, setCards] = useState<SRSCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ total: 0, correct: 0, incorrect: 0 });
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [result, setResult] = useState<{ correct: boolean; explanation: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [srsFeedback, setSrsFeedback] = useState<string | null>(null);

  useEffect(() => {
    getNextReviewCards(20).then((reviewCards) => {
      setCards(reviewCards);
      setLoading(false);
    }).catch(err => {
      console.warn('[ReviewSession] Failed to load cards:', err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length) {
      const card = cards[currentIndex];
      import(`../../data/exercises/${card.card_id}.json`).then((mod) => {
        setExercise(mod.default || mod);
        setResult(null);
        setSrsFeedback(null);
      }).catch(err => {
        console.warn('[ReviewSession] Failed to load exercise:', err);
      });
    }
  }, [cards, currentIndex]);

  const handleBoardClick = useCallback((x: number, y: number) => {
    if (!exercise || result) return;
    const matchedMove = exercise.correct_moves.find((m) => m.x === x && m.y === y);
    if (matchedMove) {
      setResult({ correct: matchedMove.is_correct, explanation: matchedMove.explanation });
    } else {
      setResult({ correct: false, explanation: 'Bu hamle beklenen seçenekler arasında değil.' });
    }
  }, [exercise, result]);

  const handleAnswer = async (correct: boolean) => {
    if (currentIndex >= cards.length) return;
    const card = cards[currentIndex];

    await recordSRSCardResult(card.card_id, correct);

    const feedback = correct
      ? (card.repetitions === 0 ? 'Bu kart öğrenilmeye başlandı. Yarın tekrar gelecek.' :
         `Bu kart ${Math.round(card.interval_days * 1.5)} gün sonra tekrar gelecek.`)
      : 'Bu kart sıfırlandı. Yarın tekrar gelecek.';
    setSrsFeedback(feedback);

    setSessionStats(s => ({
      total: s.total + 1,
      correct: s.correct + (correct ? 1 : 0),
      incorrect: s.incorrect + (correct ? 0 : 1),
    }));
  };

  const handleNext = () => {
    if (currentIndex + 1 >= cards.length) {
      setFinished(true);
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-card rounded w-1/3 mx-auto" />
          <div className="h-4 bg-bg-card rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Tekrar kartınız yok!</h2>
        <p className="text-text-secondary mb-6">Şu an tekrar edilecek kart bulunmuyor.</p>
        <button onClick={() => setView('home')} className="btn-primary px-6 py-2.5 rounded-xl">
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  if (finished) {
    const accuracy = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0;
    return (
      <div className="max-w-2xl mx-auto py-12 text-center animate-fade-in">
        <div className="text-5xl mb-6">🎯</div>
        <h2 className="text-3xl font-bold mb-4">Tekrar Tamamlandı!</h2>
        <div className="glass rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-3xl font-bold text-accent">{sessionStats.total}</div>
              <div className="text-sm text-text-secondary">Toplam</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-success">{sessionStats.correct}</div>
              <div className="text-sm text-text-secondary">Doğru</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-error">{sessionStats.incorrect}</div>
              <div className="text-sm text-text-secondary">Yanlış</div>
            </div>
          </div>
          <div className="text-2xl font-bold">%{accuracy} başarı</div>
        </div>
        <div className="flex gap-4 justify-center">
          <button onClick={() => setView('home')} className="btn-ghost px-6 py-2.5 rounded-xl">
            Ana Sayfaya Dön
          </button>
          <button onClick={() => setView('exercise')} className="btn-primary px-6 py-2.5 rounded-xl">
            Alıştırmalara Git
          </button>
        </div>
      </div>
    );
  }

  const boardSize = (exercise?.board_size || 9) as BoardSize;
  const board = exercise ? createBoardFromStones(exercise.initial_stones, boardSize) : [];
  const highlights: Highlight[] = [];
  if (result && !result.correct && exercise) {
    const correctMove = exercise.correct_moves.find((m) => m.is_correct);
    if (correctMove) highlights.push({ x: correctMove.x, y: correctMove.y, type: 'good' });
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => setView('exercise')} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Geri Dön
        </button>
        <div className="text-sm text-text-secondary">
          Kart {currentIndex + 1} / {cards.length}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="h-2 bg-bg-card/50 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Session stats bar */}
      <div className="flex gap-4 mb-6 text-sm">
        <span className="text-success">✓ {sessionStats.correct}</span>
        <span className="text-error">✗ {sessionStats.incorrect}</span>
        <span className="text-text-secondary">Kalan: {cards.length - currentIndex}</span>
      </div>

      {exercise && (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-sm glass rounded-2xl p-4">
              <Board size={boardSize} board={board} highlights={highlights} onIntersectionClick={handleBoardClick} interactive={!result} showCoordinates={true} />
            </div>
          </div>

          <div className="lg:w-72 space-y-4">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-bold mb-1">{exercise.title}</h3>
              <p className="text-sm text-text-secondary">{exercise.description}</p>
            </div>

            {result && (
              <div className={`animate-scale-in rounded-2xl p-5 border ${
                result.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
              }`}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${result.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                    {result.correct ? '✓' : '✗'}
                  </div>
                  <span className="font-bold">{result.correct ? 'Doğru!' : 'Yanlış'}</span>
                </div>
                <p className="text-sm text-text-secondary">{result.explanation}</p>

                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleAnswer(true)} className="flex-1 btn-primary py-2 rounded-xl text-sm">
                    Biliyordum
                  </button>
                  <button onClick={() => handleAnswer(false)} className="flex-1 btn-ghost py-2 rounded-xl text-sm">
                    Bilmiyordum
                  </button>
                </div>
              </div>
            )}

            {srsFeedback && (
              <div className="animate-scale-in rounded-2xl p-4 border border-info/30 bg-info/10">
                <p className="text-sm text-text-secondary">{srsFeedback}</p>
                <button onClick={handleNext} className="mt-3 w-full btn-primary py-2 rounded-xl text-sm">
                  {currentIndex + 1 >= cards.length ? 'Sonuçları Gör' : 'Sonraki Kart →'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
