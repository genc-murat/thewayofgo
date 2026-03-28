import { useState, useEffect } from 'react';
import { getUserStats, getWeakAreas, getStreak, getDailyProgress } from '../../utils/progressDb';
import { getTypeDisplayName, canAdvanceLevel } from '../../utils/adaptiveDifficulty';
import type { WeakArea } from '../../utils/progressDb';
import { useAppStore } from '../../stores/appStore';
import { getSRSStats, type SRSStats } from '../../utils/srs';
import { getActiveGoals, type Goal } from '../../utils/goals';
import { getDetailedWeaknessProfile, type DetailedWeakness } from '../../utils/weaknessEngine';

interface StatsData {
  total_lessons_completed: number;
  total_exercises_completed: number;
  total_exercises_correct: number;
  total_stars: number;
}

export function ProgressPage() {
  const { setView, currentLevel } = useAppStore();
  const [stats, setStats] = useState<StatsData>({
    total_lessons_completed: 0,
    total_exercises_completed: 0,
    total_exercises_correct: 0,
    total_stars: 0,
  });
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([]);
  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [daily, setDaily] = useState({ exercises: 0, lessons: 0 });
  const [canAdvance, setCanAdvance] = useState({ canAdvance: false, progress: 0, required: 80, message: '' });
  const [srsStats, setSrsStats] = useState<SRSStats>({ total_cards: 0, due_today: 0, learned: 0, learning: 0, lapsed: 0 });
  const [goals, setGoals] = useState<Goal[]>([]);
  const [detailedWeakness, setDetailedWeakness] = useState<DetailedWeakness[]>([]);

  useEffect(() => {
    getUserStats().then(setStats).catch(() => {});
    getWeakAreas().then(setWeakAreas).catch(() => {});
    getStreak().then(setStreak).catch(() => {});
    getDailyProgress().then(setDaily).catch(() => {});
    canAdvanceLevel(currentLevel).then(setCanAdvance).catch(() => {});
    getSRSStats().then(setSrsStats).catch(() => {});
    getActiveGoals().then(setGoals).catch(() => {});
    getDetailedWeaknessProfile().then(setDetailedWeakness).catch(() => {});
  }, []);

  const statItems = [
    { label: 'Tamamlanan Ders', value: stats.total_lessons_completed.toString(), icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>, gradient: 'from-amber-500/20 to-amber-600/5' },
    { label: 'Alıştırma', value: stats.total_exercises_completed.toString(), icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>, gradient: 'from-blue-500/20 to-blue-600/5' },
    { label: 'Doğru Cevap', value: stats.total_exercises_correct.toString(), icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>, gradient: 'from-emerald-500/20 to-emerald-600/5' },
    { label: 'Günlük Seri', value: streak.current.toString(), icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>, gradient: 'from-rose-500/20 to-orange-600/5' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">İlerleme</h2>
        <p className="text-text-secondary">Öğrenme yolculuğunuzun özeti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statItems.map((stat) => (
          <div key={stat.label} className={`glass rounded-2xl p-5 bg-gradient-to-br ${stat.gradient} border border-glass-border card-hover`}>
            <div className="text-text-secondary mb-3">{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-text-secondary font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level advance */}
      {canAdvance.progress > 0 && (
        <div className="glass rounded-2xl p-6 border border-accent/20">
          <h3 className="font-bold text-lg mb-4">Seviye İlerlemesi</h3>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1">
              <div className="h-3 bg-bg-primary/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${canAdvance.canAdvance ? 'bg-success shadow-lg shadow-success/20' : 'bg-accent'}`}
                  style={{ width: `${(canAdvance.progress / canAdvance.required) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-sm font-medium text-text-secondary">{canAdvance.progress}% / {canAdvance.required}%</span>
          </div>
          <p className="text-sm text-text-secondary">{canAdvance.message}</p>
        </div>
      )}

      {/* Weak Areas */}
      <WeakAreasPanel weakAreas={weakAreas} detailedWeakness={detailedWeakness} />

      {/* SRS Stats */}
      {srsStats.total_cards > 0 && (
        <div className="glass rounded-2xl p-6 border border-glass-border">
          <h3 className="font-bold text-lg mb-5">Aralıklı Tekrar (SRS)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-bg-primary/40">
              <div className="text-2xl font-bold text-accent">{srsStats.due_today}</div>
              <div className="text-xs text-text-secondary">Bugün Tekrar</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-bg-primary/40">
              <div className="text-2xl font-bold text-emerald-400">{srsStats.learned}</div>
              <div className="text-xs text-text-secondary">Öğrenildi</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-bg-primary/40">
              <div className="text-2xl font-bold text-blue-400">{srsStats.learning}</div>
              <div className="text-xs text-text-secondary">Öğreniliyor</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-bg-primary/40">
              <div className="text-2xl font-bold text-text-primary">{srsStats.total_cards}</div>
              <div className="text-xs text-text-secondary">Toplam Kart</div>
            </div>
          </div>
          {srsStats.due_today > 0 && (
            <button
              onClick={() => setView('exercise')}
              className="mt-4 w-full btn-primary py-2.5 rounded-xl text-sm font-medium"
            >
              {srsStats.due_today} Kart Tekrar Et
            </button>
          )}
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="glass rounded-2xl p-6 border border-glass-border">
          <h3 className="font-bold text-lg mb-5">Aktif Hedefler</h3>
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </div>
      )}

      {/* Daily goal */}
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-5">Günlük Hedef</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-xl bg-bg-primary/40">
            <div className="text-2xl font-bold text-accent">{daily.exercises}</div>
            <div className="text-xs text-text-secondary">Çözülen Alıştırma</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-bg-primary/40">
            <div className="text-2xl font-bold text-emerald-400">{daily.lessons}</div>
            <div className="text-xs text-text-secondary">Tamamlanan Ders</div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button onClick={() => setView('exercise')} className="flex-1 btn-primary py-3 rounded-xl text-sm font-medium">
          Alıştırma Çöz
        </button>
        <button onClick={() => setView('learn')} className="flex-1 btn-ghost py-3 rounded-xl text-sm font-medium">
          Derse Devam Et
        </button>
      </div>
    </div>
  );
}

function WeakAreasPanel({ weakAreas, detailedWeakness }: { weakAreas: WeakArea[]; detailedWeakness: DetailedWeakness[] }) {
  if (weakAreas.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-3">Zayıf Noktalar</h3>
        <p className="text-sm text-text-secondary">
          Henüz yeterli veri yok. Alıştırma çözdükçe zayıf noktalarınız burada görünecek.
        </p>
      </div>
    );
  }

  const accuracyColors: Record<string, string> = {
    high: 'bg-success',
    medium: 'bg-warning',
    low: 'bg-error',
  };

  function getAccuracyLevel(acc: number): string {
    if (acc >= 75) return 'high';
    if (acc >= 50) return 'medium';
    return 'low';
  }

  const trendIcons: Record<string, string> = {
    improving: '↑',
    declining: '↓',
    stable: '→',
  };

  const trendColors: Record<string, string> = {
    improving: 'text-success',
    declining: 'text-error',
    stable: 'text-text-secondary',
  };

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <h3 className="font-bold text-lg mb-4">Zayıf Noktalar</h3>
      <div className="space-y-4">
        {weakAreas.map((area) => {
          const detail = detailedWeakness.find(d => d.exercise_type === area.exercise_type);
          const trend = detail?.trend ?? 'stable';
          return (
            <div key={area.exercise_type} className="p-4 rounded-xl bg-bg-primary/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{getTypeDisplayName(area.exercise_type)}</span>
                <div className="flex items-center gap-2">
                  {detail && (
                    <span className={`text-sm ${trendColors[trend]}`}>{trendIcons[trend]}</span>
                  )}
                  <span className={`text-xs font-semibold ${area.accuracy >= 75 ? 'text-success' : area.accuracy >= 50 ? 'text-warning' : 'text-error'}`}>
                    %{Math.round(area.accuracy)} başarı
                  </span>
                </div>
              </div>
              <div className="h-2 bg-bg-primary/60 rounded-full overflow-hidden">
                <div
                  className={`h-full ${accuracyColors[getAccuracyLevel(area.accuracy)]} rounded-full transition-all duration-1000`}
                  style={{ width: `${area.accuracy}%` }}
                />
              </div>
              <div className="text-xs text-text-secondary mt-1">
                {area.total_attempts} deneme, {area.correct_attempts} doğru
                {detail && detail.recent_accuracy !== area.accuracy && (
                  <span className="ml-2">• Son: %{Math.round(detail.recent_accuracy)}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function GoalCard({ goal }: { goal: Goal }) {
  const pct = goal.target_value > 0
    ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
    : 0;

  const typeLabels: Record<string, string> = {
    daily_exercises: 'Günlük Alıştırma',
    weekly_lessons: 'Haftalık Ders',
    level_complete: 'Seviye Tamamlama',
    custom: 'Özel Hedef',
  };

  return (
    <div className="p-4 rounded-xl bg-bg-primary/40">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{typeLabels[goal.goal_type] ?? goal.goal_type}</span>
        <span className="text-xs text-text-secondary">{goal.current_value}/{goal.target_value}</span>
      </div>
      <div className="h-2 bg-bg-primary/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-success' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-text-secondary mt-1">%{pct} tamamlandı</div>
    </div>
  );
}
