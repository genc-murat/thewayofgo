import './App.css';
import { Layout } from './components/Layout';
import { HomePage } from './components/Home';
import { LessonViewer } from './components/Lesson';
import { GamePlay } from './components/Game';
import { ExerciseView } from './components/Exercise';
import { ProgressPage } from './components/Progress';
import { useAppStore } from './stores/appStore';

function App() {
  const currentView = useAppStore((state) => state.currentView);

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage />;
      case 'learn':
        return <LessonViewer />;
      case 'play':
        return <GamePlay />;
      case 'exercise':
        return <ExerciseView />;
      case 'progress':
        return <ProgressPage />;
      default:
        return <HomePage />;
    }
  };

  return <Layout>{renderView()}</Layout>;
}

export default App;
