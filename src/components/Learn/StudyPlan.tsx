import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getSRSStats } from '../../utils/srs';
import { getWeakAreas, getDailyProgress } from '../../utils/progressDb';
import { getNextRecommendedLesson } from '../../utils/lessonPath';

export interface StudyPlanItem {
  id: string;
  type: 'review' | 'lesson' | 'exercise' | 'game';
  title: string;
  description: string;
  estimated_minutes: number;
  completed: boolean;
  action?: () => void;
}

interface StudyPlanProps {
  compact?: boolean;
}

export function StudyPlan({ compact = false }: StudyPlanProps) {
  const { loadLesson, startAiGame, setView } = useAppStore();
  const [plan, setPlan] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generatePlan();
  }, []);

  async function generatePlan() {
    setLoading(true);
    try {
      const items: StudyPlanItem[] = [];

      const srsStats = await getSRSStats();
      if (srsStats.due_today > 0) {
        items.push({
          id: 'srs-review',
          type: 'review',
          title: `Tekrar: ${srsStats.due_today} kart`,
          description: 'Aralıklı tekrar kartlarınızı çözün',
          estimated_minutes: Math.min(srsStats.due_today * 2, 10),
          completed: false,
        });
      }

      const weakAreas = await getWeakAreas();
      if (weakAreas.length > 0 && weakAreas[0].accuracy < 70) {
        items.push({
          id: 'weak-exercise',
          type: 'exercise',
          title: `Zayıf Nokta: ${weakAreas[0].exercise_type}`,
          description: `%${Math.round(weakAreas[0].accuracy)} başarı oranı — pratik yapın`,
          estimated_minutes: 7,
          completed: false,
        });
      }

      const nextLesson = await getNextRecommendedLesson();
      if (nextLesson) {
        items.push({
          id: 'next-lesson',
          type: 'lesson',
          title: `Ders: ${nextLesson.lessonId}`,
          description: 'Bir sonraki dersinize devam edin',
          estimated_minutes: 8,
          completed: false,
        });
      }

      const daily = await getDailyProgress();
      if (daily.exercises < 3) {
        items.push({
          id: 'daily-exercise',
          type: 'exercise',
          title: 'Günlük Alıştırma',
          description: `${daily.exercises}/3 tamamlandı`,
          estimated_minutes: 5,
          completed: daily.exercises >= 3,
        });
      }

      items.push({
        id: 'quick-game',
        type: 'game',
        title: 'Hızlı Oyun (9x9)',
        description: 'AI ile pratik yapın',
        estimated_minutes: 5,
        completed: false,
      });

      setPlan(items);
    } catch {
      setPlan([]);
    }
    setLoading(false);
  }

  const typeIcons: Record<string, string> = {
    review: '🔄',
    lesson: '📖',
    exercise: '✏️',
    game: '🎮',
  };

  const typeColors: Record<string, string> = {
    review: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    lesson: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    exercise: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    game: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  };

  const totalMinutes = plan.filter(i => !i.completed).reduce((sum, i) => sum + i.estimated_minutes, 0);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-bg-card rounded w-1/3" />
          <div className="h-3 bg-bg-card rounded w-2/3" />
          <div className="h-3 bg-bg-card rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="glass rounded-2xl p-5 border border-glass-border card-hover">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm">Bugünkü Plan</h3>
          <span className="text-xs text-text-secondary bg-accent/10 text-accent px-2 py-0.5 rounded-full">
            ~{totalMinutes} dk
          </span>
        </div>
        <div className="space-y-2">
          {plan.slice(0, 3).map(item => (
            <div key={item.id} className={`flex items-center gap-2 text-xs ${item.completed ? 'opacity-40 line-through' : ''}`}>
              <span>{typeIcons[item.type]}</span>
              <span className="truncate">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg">Bugünkü Plan</h3>
        <span className="text-sm text-text-secondary">
          ~{totalMinutes} dakika
        </span>
      </div>

      <div className="space-y-3">
        {plan.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              if (item.type === 'review') setView('exercise');
              else if (item.type === 'lesson') loadLesson('l1-1-1');
              else if (item.type === 'exercise') setView('exercise');
              else if (item.type === 'game') startAiGame(9, 2);
            }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border text-left ${
              item.completed
                ? 'bg-bg-primary/20 border-transparent opacity-50'
                : 'bg-bg-primary/40 border-glass-border hover:border-accent/30'
            }`}
          >
            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${typeColors[item.type]}`}>
              {typeIcons[item.type]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{item.title}</div>
              <div className="text-xs text-text-secondary truncate">{item.description}</div>
            </div>
            <span className="text-xs text-text-secondary whitespace-nowrap">{item.estimated_minutes} dk</span>
            {item.completed && <span className="text-success text-sm">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
