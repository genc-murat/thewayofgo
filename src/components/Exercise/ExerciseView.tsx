import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import type { BoardSize, Highlight } from '../../types';
import { getAdaptiveDifficulty, getTypeDisplayName, type DifficultyRecommendation } from '../../utils/adaptiveDifficulty';
import { createBoardFromStones } from '../../utils/boardUtils';
import { getSRSStats } from '../../utils/srs';
import { EXERCISE_CATALOG } from '../../data/exerciseCatalog';

const TYPE_COLORS: Record<string, string> = {
  'place_correct': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'capture_stones': 'bg-red-500/15 text-red-400 border-red-500/20',
  'life_and_death': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'connect_groups': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'cut_groups': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'defend_group': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'territorial_control': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'endgame': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'opening': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'multi_step': 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
};

export function ExerciseView() {
  const {
    currentExercise, loadExercise, setView,
  } = useAppStore();

  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<DifficultyRecommendation | null>(null);
  const [srsStats, setSrsStats] = useState({ total_cards: 0, due_today: 0, learned: 0, learning: 0, lapsed: 0 });

  useEffect(() => {
    getAdaptiveDifficulty(2).then(setRecommendation).catch(err => console.warn('[ExerciseView] getAdaptiveDifficulty failed:', err));
    getSRSStats().then(setSrsStats).catch(err => console.warn('[ExerciseView] getSRSStats failed:', err));
  }, []);

  const filteredCatalog = useMemo(() => {
    let items = EXERCISE_CATALOG;
    if (filterLevel !== null) items = items.filter(e => e.level === filterLevel);
    if (filterType !== null) items = items.filter(e => e.type === filterType);
    return items;
  }, [filterLevel, filterType]);

  const types = useMemo(() => [...new Set(EXERCISE_CATALOG.map(e => e.type))], []);

  if (currentExercise) return <ExercisePlayer />;

  // Get recommended exercises based on weak areas
  const recommendedExercises = useMemo(() => {
    if (!recommendation || recommendation.focusTypes.length === 0) return [];
    return EXERCISE_CATALOG
      .filter(ex => recommendation.focusTypes.includes(ex.type))
      .slice(0, 3);
  }, [recommendation]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Alıştırmalar</h2>
        <p className="text-text-secondary">Seviye ve türe göre filtreleyerek çalışın ({EXERCISE_CATALOG.length} alıştırma)</p>
      </div>

      {/* SRS Review Mode */}
      {srsStats.due_today > 0 && (
        <div className="glass rounded-2xl p-6 border border-info/20 bg-info/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-bold">Bugünün Tekrarı ({srsStats.due_today})</h3>
                <p className="text-sm text-text-secondary">Aralıklı tekrar kartlarınız hazır</p>
              </div>
            </div>
            <button
              onClick={() => setView('srs-review')}
              className="btn-primary px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              Tekrara Başla
            </button>
          </div>
        </div>
      )}

      {/* Recommended section */}
      {recommendedExercises.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-accent/20">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="text-lg font-bold">Sizin İçin Önerilen</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">{recommendation?.reason}</p>
          {recommendation && recommendation.focusTypes.length > 0 && (
            <p className="text-sm text-text-secondary mb-4">
              Odaklanmanız gereken türler: <span className="text-accent font-medium">
                {recommendation.focusTypes.map(t => getTypeDisplayName(t)).join(', ')}
              </span>
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendedExercises.map(ex => (
              <button key={ex.id} onClick={() => loadExercise(ex.id)}
                className="bg-accent/5 rounded-xl p-4 text-left border border-accent/20 hover:border-accent/40 transition-all group">
                <div className="flex items-start justify-between mb-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[ex.type] || 'glass text-text-secondary'}`}>
                    {getTypeDisplayName(ex.type)}
                  </span>
                  <span className="text-xs text-text-secondary">Lv.{ex.level}</span>
                </div>
                <h4 className="font-semibold text-sm group-hover:text-accent transition-colors">{ex.title}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterLevel(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tümü
        </button>
        {[1, 2, 3, 4, 5, 6].map(lvl => (
          <button key={lvl} onClick={() => setFilterLevel(lvl === filterLevel ? null : lvl)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterLevel === lvl ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            Seviye {lvl}
          </button>
        ))}
        <span className="w-px h-6 bg-glass-border self-center mx-1" />
        <button onClick={() => setFilterType(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === null ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
          Tüm Türler
        </button>
        {types.map(t => (
          <button key={t} onClick={() => setFilterType(t === filterType ? null : t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === t ? 'gradient-accent text-bg-primary' : 'glass text-text-secondary hover:text-text-primary'}`}>
            {getTypeDisplayName(t)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredCatalog.map(ex => (
          <button key={ex.id} onClick={() => loadExercise(ex.id)}
            className="glass rounded-2xl p-5 text-left card-hover border border-glass-border hover:border-accent/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[ex.type] || 'glass text-text-secondary'}`}>
                {getTypeDisplayName(ex.type)}
              </span>
              <span className="text-xs text-text-secondary">Seviye {ex.level}</span>
            </div>
            <h4 className="font-bold mb-1 group-hover:text-accent transition-colors">{ex.title}</h4>
            <div className="flex items-center gap-1 text-xs text-accent">
              {'★'.repeat(Math.max(0, Math.min(5, ex.difficulty || 0)))}{'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, ex.difficulty || 0))))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ExercisePlayer() {
  const {
    currentExercise, exerciseResult, exerciseAttempts,
    submitExerciseMove, closeExercise, loadExercise,
    currentStepIndex, stepBoard, stepResults, allStepsCompleted,
    submitMultiStepMove, advanceToNextStep,
  } = useAppStore();

  const [bookmarked, setBookmarked] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<{ correct: boolean; last_attempt: string }[]>([]);
  const isMultiStep = currentExercise?.steps && currentExercise.steps.length > 0;

  useEffect(() => {
    if (currentExercise) {
      import('../../utils/progressDb').then(({ isBookmarked, getExerciseHistory }) => {
        isBookmarked(currentExercise.id).then(setBookmarked).catch(err => console.warn('[ExercisePlayer] isBookmarked failed:', err));
        getExerciseHistory(currentExercise.id, 5).then(setExerciseHistory).catch(err => console.warn('[ExercisePlayer] getExerciseHistory failed:', err));
      });
    }
  }, [currentExercise?.id]);

  const toggleBookmark = useCallback(async () => {
    if (!currentExercise) return;
    const { addBookmark, removeBookmark } = await import('../../utils/progressDb');
    if (bookmarked) {
      await removeBookmark(currentExercise.id);
      setBookmarked(false);
    } else {
      await addBookmark(currentExercise.id, 'exercise');
      setBookmarked(true);
    }
  }, [currentExercise, bookmarked]);

  const handleBoardClick = useCallback(async (x: number, y: number) => {
    if (exerciseResult || !currentExercise) return;
    if (isMultiStep && !allStepsCompleted) {
      const lastResult = stepResults[stepResults.length - 1];
      if (lastResult && !lastResult.correct) return;
      await submitMultiStepMove(x, y);
    } else {
      await submitExerciseMove(x, y);
    }
  }, [exerciseResult, submitExerciseMove, submitMultiStepMove, currentExercise, isMultiStep, stepResults, allStepsCompleted]);

  if (!currentExercise) return null;

  const boardSize = currentExercise.board_size as BoardSize;
  const steps = currentExercise.steps;
  const currentStep = isMultiStep && steps ? steps[currentStepIndex] : null;
  const lastStepResult = stepResults.length > 0 ? stepResults[stepResults.length - 1] : null;

  // Determine board for multi-step
  const board = isMultiStep && stepBoard
    ? stepBoard
    : createBoardFromStones(currentExercise.initial_stones, boardSize);

  const highlights: Highlight[] = [];
  if (!isMultiStep && exerciseResult && !exerciseResult.correct && exerciseResult.best_move) {
    highlights.push({ x: exerciseResult.best_move[0], y: exerciseResult.best_move[1], type: 'good' });
  }
  if (isMultiStep && lastStepResult && !lastStepResult.correct && lastStepResult.best_move) {
    highlights.push({ x: lastStepResult.best_move[0], y: lastStepResult.best_move[1], type: 'good' });
  }

  // Determine hints source
  const hints = isMultiStep && currentStep?.hints ? currentStep.hints : currentExercise.hints;

  // Current step description
  const stepDescription = isMultiStep && currentStep
    ? (currentStep.explanation || currentExercise.description)
    : currentExercise.description;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={() => closeExercise()} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Tüm Alıştırmalar
        </button>

        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[currentExercise.type] || ''}`}>
            {getTypeDisplayName(currentExercise.type)}
          </span>
          <span className="text-xs">Zorluk: {'★'.repeat(Math.max(0, Math.min(5, currentExercise.difficulty || 0)))}{'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, currentExercise.difficulty || 0))))}</span>
        </div>
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">{currentExercise.title}</h2>
          <button
            onClick={toggleBookmark}
            className={`text-lg transition-all ${bookmarked ? 'text-amber-400' : 'text-text-secondary hover:text-amber-400'}`}
            title={bookmarked ? 'Yer iminden kaldır' : 'Yer imine ekle'}
          >
            {bookmarked ? '★' : '☆'}
          </button>
        </div>
        <p className="text-text-secondary mt-1">{stepDescription}</p>
      </div>

      {/* Multi-step indicator */}
      {isMultiStep && steps && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-text-secondary">
              Adım {currentStepIndex + 1} / {steps.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {steps.map((_, idx) => {
              const isCompleted = idx < stepResults.length && stepResults[idx]?.correct;
              const isCurrent = idx === currentStepIndex;
              const isFailed = idx < stepResults.length && !stepResults[idx]?.correct;
              return (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-all ${
                    isCompleted ? 'bg-success' :
                    isFailed ? 'bg-error' :
                    isCurrent ? 'bg-accent' :
                    'bg-glass-border'
                  }`}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-sm glass rounded-2xl p-4">
            <Board
              size={boardSize}
              board={board}
              highlights={highlights}
              onIntersectionClick={handleBoardClick}
              interactive={!(exerciseResult || (isMultiStep && (allStepsCompleted || (lastStepResult && !lastStepResult.correct))))}
              showCoordinates={true}
            />
          </div>
        </div>

        <div className="lg:w-72 space-y-4">
          {/* Multi-step last step result */}
          {isMultiStep && lastStepResult && (
            <div className={`animate-scale-in rounded-2xl p-5 border ${
              lastStepResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
            }}`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${lastStepResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {lastStepResult.correct ? '✓' : '✗'}
                </div>
                <span className="font-bold">{lastStepResult.correct ? 'Doğru!' : 'Yanlış'}</span>
              </div>
              <p className="text-sm text-text-secondary">{lastStepResult.explanation}</p>
              {lastStepResult.correct && !allStepsCompleted && (
                <button
                  onClick={() => advanceToNextStep()}
                  className="mt-3 w-full btn-primary py-2 rounded-xl text-sm"
                >
                  Sonraki Adım →
                </button>
              )}
            </div>
          )}

          {/* Single-step result */}
          {!isMultiStep && exerciseResult && (
            <div className={`animate-scale-in rounded-2xl p-5 border ${
              exerciseResult.correct ? 'bg-success/10 border-success/30 glow-success' : 'bg-error/10 border-error/30 glow-error'
            }`}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold ${exerciseResult.correct ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {exerciseResult.correct ? '✓' : '✗'}
                </div>
                <span className="font-bold">{exerciseResult.correct ? 'Doğru!' : 'Yanlış'}</span>
              </div>
              <p className="text-sm text-text-secondary">{exerciseResult.explanation}</p>
            </div>
          )}

          {/* Completed all steps */}
          {isMultiStep && allStepsCompleted && (
            <div className="animate-scale-in rounded-2xl p-5 border bg-success/10 border-success/30 glow-success">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold bg-success/20 text-success">✓</div>
                <span className="font-bold">Tüm Adımlar Tamamlandı!</span>
              </div>
              <p className="text-sm text-text-secondary">Tüm adımları başarıyla çözdünüz.</p>
            </div>
          )}

          <div className="glass rounded-2xl p-5">
            <div className="text-sm text-text-secondary mb-1">Deneme Sayısı</div>
            <div className="text-3xl font-bold">{exerciseAttempts}</div>
          </div>

          {/* Hints */}
          {hints.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-medium mb-2">İpuçları</div>
              {hints.slice(0, 1).map((hint, i) => (
                <p key={i} className="text-sm text-text-secondary">{hint}</p>
              ))}
            </div>
          )}

          {/* Exercise History */}
          {exerciseHistory.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="text-sm font-medium mb-2">Geçmiş Denemeler</div>
              <div className="space-y-1.5">
                {exerciseHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className={h.correct ? 'text-success' : 'text-error'}>
                      {h.correct ? '✓ Doğru' : '✗ Yanlış'}
                    </span>
                    <span className="text-text-secondary">
                      {h.last_attempt ? new Date(h.last_attempt).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-glass-border text-xs text-text-secondary">
                Toplam: %{exerciseHistory.length > 0 ? Math.round((exerciseHistory.filter(h => h.correct).length / exerciseHistory.length) * 100) : 0} doğruluk
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => closeExercise()} className="flex-1 btn-ghost py-2.5 rounded-xl text-sm">Listeye Dön</button>
            {(exerciseResult || (isMultiStep && (allStepsCompleted || (lastStepResult && !lastStepResult.correct)))) && (
              <button onClick={() => loadExercise(currentExercise.id)} className="flex-1 btn-primary py-2.5 rounded-xl text-sm">Tekrar Dene</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


