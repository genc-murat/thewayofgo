import { useState, useEffect } from 'react';
import { getUnlockedAchievements, ACHIEVEMENT_DEFS } from '../../utils/progressDb';
import type { Achievement } from '../../utils/progressDb';

export function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUnlockedAchievements().then((data) => {
      setAchievements(data);
      setLoading(false);
    }).catch(err => {
      console.warn('[AchievementsPanel] Failed to load:', err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-bg-card rounded w-1/3" />
          <div className="h-3 bg-bg-card rounded w-2/3" />
        </div>
      </div>
    );
  }

  const unlockedIds = new Set(achievements.map(a => a.achievement_id));

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-lg">Başarımlar</h3>
        <span className="text-sm text-text-secondary">{achievements.length}/{ACHIEVEMENT_DEFS.length}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {ACHIEVEMENT_DEFS.map((def) => {
          const unlocked = unlockedIds.has(def.id);
          const achievement = achievements.find(a => a.achievement_id === def.id);
          return (
            <div
              key={def.id}
              className={`relative rounded-xl p-4 text-center border transition-all ${
                unlocked
                  ? 'bg-accent/10 border-accent/30'
                  : 'bg-bg-primary/30 border-glass-border opacity-50'
              }`}
              title={def.description}
            >
              <div className={`text-3xl mb-2 ${unlocked ? '' : 'grayscale'}`}>
                {def.icon}
              </div>
              <div className="text-xs font-medium truncate">{def.name}</div>
              <div className="text-[10px] text-text-secondary truncate">{def.description}</div>
              {unlocked && achievement && (
                <div className="text-[9px] text-accent mt-1">
                  {new Date(achievement.unlocked_at).toLocaleDateString('tr-TR')}
                </div>
              )}
              {!unlocked && (
                <div className="absolute top-1 right-1 text-text-secondary">
                  <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
