import { useAppStore } from '../../stores/appStore';
import { ExerciseCatalog } from './ExerciseCatalog';
import { ExercisePlayer } from './ExercisePlayer';

export function ExerciseView() {
  const { currentExercise } = useAppStore();

  if (currentExercise) return <ExercisePlayer />;
  return <ExerciseCatalog />;
}
