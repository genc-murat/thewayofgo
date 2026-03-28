import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';
import { ExercisePlayerSidebar } from './ExercisePlayerSidebar';
import { TYPE_COLORS } from './ExerciseFilters';
import { getTypeDisplayName } from '../../utils/adaptiveDifficulty';
import { createBoardFromStones } from '../../utils/boardUtils';
import type { BoardSize, Highlight } from '../../types';
import type { ExerciseAttempt } from '../../utils/progressDb';

export function ExercisePlayer() {
  const {
    currentExercise, exerciseResult, exerciseAttempts,
    submitExerciseMove, closeExercise, loadExercise,
    currentStepIndex, stepBoard, stepResults, allStepsCompleted,
    submitMultiStepMove, advanceToNextStep, loadNextExercise,
  } = useAppStore();

  const [bookmarked, setBookmarked] = useState(false);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseAttempt[]>([]);
  const isMultiStep = currentExercise?.steps && currentExercise.steps.length > 0;

  useEffect(() => {
    if (currentExercise) {
      import('../../utils/progressDb').then(({ isBookmarked, getExerciseHistory }) => {
        isBookmarked(currentExercise.id).then(setBookmarked).catch(() => {});
        getExerciseHistory(currentExercise.id, 5).then(setExerciseHistory).catch(() => {});
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

  const handleNextExercise = useCallback(() => {
    if (!currentExercise) return;
    loadNextExercise(currentExercise.id);
  }, [currentExercise, loadNextExercise]);

  if (!currentExercise) return null;

  const boardSize = currentExercise.board_size as BoardSize;
  const steps = currentExercise.steps;
  const currentStep = isMultiStep && steps ? steps[currentStepIndex] : null;
  const lastStepResult = stepResults.length > 0 ? stepResults[stepResults.length - 1] : null;

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

  const hints = isMultiStep && currentStep?.hints ? currentStep.hints : currentExercise.hints;
  const stepDescription = isMultiStep && currentStep
    ? (currentStep.explanation || currentExercise.description)
    : currentExercise.description;

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <button onClick={closeExercise} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-4">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Tüm Alıştırmalar
        </button>

        <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${TYPE_COLORS[currentExercise.type] || ''}`}>
            {getTypeDisplayName(currentExercise.type)}
          </span>
          <span className="text-xs">
            Zorluk:{' '}
            {'★'.repeat(Math.max(0, Math.min(5, currentExercise.difficulty || 0)))}
            {'☆'.repeat(Math.max(0, 5 - Math.max(0, Math.min(5, currentExercise.difficulty || 0))))}
          </span>
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
          <div className="w-full max-w-md glass rounded-2xl p-4">
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

        <ExercisePlayerSidebar
          exerciseId={currentExercise.id}
          exerciseType={currentExercise.type}
          exerciseAttempts={exerciseAttempts}
          exerciseResult={exerciseResult}
          isMultiStep={!!isMultiStep}
          stepResults={stepResults}
          allStepsCompleted={allStepsCompleted}
          lastStepResult={lastStepResult}
          hints={hints}
          exerciseHistory={exerciseHistory}
          onRetry={() => loadExercise(currentExercise.id)}
          onNextExercise={handleNextExercise}
          onAdvanceStep={advanceToNextStep}
        />
      </div>
    </div>
  );
}
