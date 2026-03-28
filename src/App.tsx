import './App.css';
import { useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/Home';
import { LessonViewer } from './components/Lesson';
import { GamePlay } from './components/Game';
import { ExerciseView } from './components/Exercise';
import { ProgressPage } from './components/Progress';
import { SettingsPage } from './components/Settings';
import { useAppStore } from './stores/appStore';
import { soundEngine } from './utils/soundEngine';
import { applyTheme, getStoredTheme } from './utils/themes';

function App() {
  const currentView = useAppStore((state) => state.currentView);

  useEffect(() => {
    applyTheme(getStoredTheme());
    const initSound = () => {
      soundEngine.init();
      document.removeEventListener('click', initSound);
    };
    document.addEventListener('click', initSound);
    return () => document.removeEventListener('click', initSound);
  }, []);

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
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage />;
    }
  };

  return <Layout>{renderView()}</Layout>;
}

export default App;
