import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { READING_LADDERS } from '../../data/readingLadders';
import { LadderRung } from './LadderRung';

interface LadderViewProps {
  ladderId: string;
  onBack: () => void;
}

export function LadderView({ ladderId, onBack }: LadderViewProps) {
  const ladder = READING_LADDERS.find(l => l.id === ladderId);
  if (!ladder) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Merdiven bulunamadı.</p>
      </div>
    );
  }

  const [exerciseStars, setExerciseStars] = useState<Record<string, number>>({});
  const [totalStars, setTotalStars] = useState(0);
  const [currentRungIndex, setCurrentRungIndex] = useState(0);

  // Load exercise progress (simplified - in real app would come from DB)
  useEffect(() => {
    // For demo purposes, simulate some progress
    // In production, this would fetch from progress database
    const mockProgress = {
      'e1-1-2': 3,
      'e1-1-4': 2,
      'e1-1-5': 1,
    };
    setExerciseStars(mockProgress);
    setTotalStars(Object.values(mockProgress).reduce((sum, stars) => sum + stars, 0));
    
    // Find current rung (first locked rung)
    const currentIndex = ladder.rungs.findIndex(rung => {
      const starsForRung = exerciseStars[rung.exercise_id] ?? 0;
      return starsForRung < rung.stars_to_unlock;
    });
    setCurrentRungIndex(currentIndex >= 0 ? currentIndex : ladder.rungs.length - 1);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in-up">
      <div className="mb-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
          Geri
        </button>
        <h2 className="text-2xl font-bold mb-2">{ladder.title}</h2>
        <p className="text-sm text-text-secondary">{ladder.description}</p>
      </div>

      <div className="space-y-6">
        {/* Progress overview */}
        <div className="glass rounded-2xl p-6 border border-glass-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-primary">İlerleme</h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">{totalStars}</span>
              <span className="text-sm text-text-secondary">toplam yıldız</span>
            </div>
          </div>
          <div className="h-2 bg-bg-card/50 rounded-full overflow-hidden mb-4">
            {(() => {
              const maxStars = ladder.rungs.reduce((sum, rung) => sum + rung.stars_to_unlock, 0);
              const progressPercent = maxStars > 0 ? (totalStars / maxStars) * 100 : 0;
              return (
                <>
                  <div className="h-full bg-gradient-to-r from-accent to-amber-400 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                  <div className="flex justify-between text-xs text-text-secondary mt-2">
                    <span>Kilitleme: {totalStars}/{maxStars} yıldız</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>

        {/* Ladder visualization */}
        <div className="glass rounded-2xl p-6 border border-glass-border">
          <h3 className="font-bold text-text-primary mb-4">Merdiven</h3>
          <div className="flex items-center gap-8">
            {/* Left side: rung indicators */}
            <div className="flex items-start gap-6">
              {ladder.rungs.map((rung, index) => {
                const starsForRung = exerciseStars[rung.exercise_id] ?? 0;
                const isCompleted = starsForRung >= rung.stars_to_unlock;
                const isCurrent = index === currentRungIndex;
                
                return (
                  <div key={index} className="flex items-center">
                    <LadderRung 
                      rung={rung} 
                      index={index} 
                      totalStars={starsForRung} 
                      isCurrent={isCurrent && !isCompleted} 
                    />
                    {index < ladder.rungs.length - 1 && (
                      <div className="h-[2px] w-[24px] bg-bg-card/50">
                        {isCompleted && (
                          <div className="h-full w-full bg-accent" />
                        )}
                        {isCurrent && !isCompleted && (
                          <div className="h-full w-full bg-accent/50" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Right side: exercise details */}
            <div className="space-y-4">
              {ladder.rungs.map((rung, index) => {
                const starsForRung = exerciseStars[rung.exercise_id] ?? 0;
                const isCompleted = starsForRung >= rung.stars_to_unlock;
                const isCurrent = index === currentRungIndex;
                
                return (
                  <div key={index} className={`mb-4 p-4 rounded-lg border transition-all ${
                    isCompleted
                      ? 'border-success/30 bg-success/5'
                      : isCurrent
                      ? 'border-accent/30 bg-accent/5'
                      : 'bg-bg-card/50 border-transparent'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{index + 1}. Basamak</span>
                        <span className="text-sm text-text-secondary">*{rung.stars_to_unlock}★ gerekiyor</span>
                      </div>
                      {isCompleted && (
                        <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">Tamamlandı</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary">{getExerciseTitle(rung.exercise_id)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/50 text-text-secondary">
                        Zorluk: {getExerciseDifficulty(rung.exercise_id)}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                        Durum: {isCompleted ? 'Tamamlandı' : isCurrent ? 'Şu anki' : starsForRung > 0 ? 'Deneme' : 'Kilitli'}
                      </span>
                    </div>
                    {!isCompleted && isCurrent && (
                      <button
                        onClick={() => {
                          // Load exercise and navigate to exercise view
                          const loadExercise = useAppStore.getState().loadExercise;
                          loadExercise(rung.exercise_id);
                          useAppStore.getState().setView('exercise');
                        }}
                        className="btn-primary w-full py-2 rounded-xl text-sm mt-2"
                      >
                        Alıştırmaya Başla
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions (in real app would come from exercise data)
function getExerciseTitle(exerciseId: string): string {
  const titles: Record<string, string> = {
    'e1-1-2': 'Özgürlük Sayısı',
    'e1-1-4': 'İki Nokta',
    'e1-1-5': 'Üç Nokta',
    'e1-2-1': 'Kömür Al',
    'e1-2-2': 'İki Taş Birleştir',
    'e1-2-4': 'Köşe Kontrolü',
    'e1-3-3': 'İki Göz Oluştur',
    'e1-4-3': 'Kenar Bağlantı',
  };
  return titles[exerciseId] || 'Bilinmeyen Alıştırma';
}

function getExerciseDifficulty(exerciseId: string): number {
  const difficulties: Record<string, number> = {
    'e1-1-2': 1,
    'e1-1-4': 1,
    'e1-1-5': 1,
    'e1-2-1': 1,
    'e1-2-2': 1,
    'e1-2-4': 1,
    'e1-3-3': 2,
    'e1-4-3': 2,
  };
  return difficulties[exerciseId] || 1;
}
