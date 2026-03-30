import './App.css';
import { useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './components/Home';
import { LessonViewer } from './components/Lesson';
import { GamePlay } from './components/Game';
import { ExerciseView } from './components/Exercise';
import { ProgressPage } from './components/Progress';
import { SettingsPage } from './components/Settings';
import { ReviewSession } from './components/SRS';
import { PositionEditor } from './components/PositionEditor';
import { OnboardingWizard, shouldShowOnboarding } from './components/Onboarding/OnboardingWizard';
import { Openings } from './components/Openings';
import { GlossaryPage } from './components/Glossary';
import { LadderOverview } from './components/ReadingLadder';
import { ShapeCatalog } from './components/Shapes';
import { VariantExplorer } from './components/VariantExplorer';
import { useAppStore } from './stores/appStore';
import { soundEngine } from './utils/soundEngine';
import { applyTheme, getStoredTheme } from './utils/themes';

function App() {
  const currentView = useAppStore((state) => state.currentView);
  const setOnboardingData = useAppStore((state) => state.setOnboardingData);
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding());

  useEffect(() => {
    applyTheme(getStoredTheme());
    const initSound = () => {
      soundEngine.init();
      document.removeEventListener('click', initSound);
    };
    document.addEventListener('click', initSound);
    return () => document.removeEventListener('click', initSound);
  }, []);

  useEffect(() => {
    if (!showOnboarding) {
      const storedLevel = parseInt(localStorage.getItem('thewayofgo_level') ?? '1', 10);
      const storedGoal = parseInt(localStorage.getItem('thewayofgo_daily_goal') ?? '10', 10);
      setOnboardingData(storedLevel, storedGoal);
    }
  }, [showOnboarding, setOnboardingData]);

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
       case 'srs-review':
         return <ReviewSession />;
       case 'position-editor':
         return <PositionEditor />;
       case 'openings':
          return <Openings />;
        case 'glossary':
          return <GlossaryPage />;
        case 'reading-ladder':
          return <LadderOverview />;
        case 'shapes':
          return <ShapeCatalog />;
        case 'variants':
          return <VariantExplorer />;
        default:
         return <HomePage />;
     }
   };

  return (
    <>
      {showOnboarding && <OnboardingWizard onComplete={({ level, dailyGoal }) => {
        setOnboardingData(level, dailyGoal);
        setShowOnboarding(false);
      }} />}
      <Layout>{renderView()}</Layout>
    </>
  );
}

export default App;
