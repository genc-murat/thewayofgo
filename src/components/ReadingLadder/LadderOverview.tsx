import { READING_LADDERS } from '../../data/readingLadders';
import type { ReadingLadder } from '../../types';
import { useAppStore } from '../../stores/appStore';

const CATEGORY_COLORS: Record<string, string> = {
  life_and_death: 'border-red-500/30',
  tesuji: 'border-purple-500/30',
  capture: 'border-amber-500/30',
  endgame: 'border-blue-500/30',
  reading: 'border-emerald-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  life_and_death: 'Yaşam & Ölüm',
  tesuji: 'Tesuji',
  capture: 'Esir Alma',
  endgame: 'Oyun Sonu',
  reading: 'Okuma',
};

export function LadderOverview() {
  const loadExercise = useAppStore(s => s.loadExercise);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Okuma Merdiveni</h2>
        <p className="text-text-secondary">Kademeli zorlaşan tsumego serileri. Her doğru çözüm bir sonraki basamağı açar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {READING_LADDERS.map(ladder => (
          <LadderCard key={ladder.id} ladder={ladder} onStart={(exerciseId) => loadExercise(exerciseId)} />
        ))}
      </div>
    </div>
  );
}

function LadderCard({ ladder, onStart }: { ladder: ReadingLadder; onStart: (id: string) => void }) {
  const totalRungs = ladder.rungs.length;

  return (
    <div className={`glass rounded-2xl p-6 border ${CATEGORY_COLORS[ladder.category] || 'border-glass-border'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-text-primary">{ladder.title}</h3>
          <span className="text-xs text-text-secondary">{CATEGORY_LABELS[ladder.category]}</span>
        </div>
        <span className="text-xs bg-accent/10 text-accent px-2.5 py-1 rounded-full font-medium">
          {ladder.difficulty_range[0]}-{ladder.difficulty_range[1]} zorluk
        </span>
      </div>

      <p className="text-sm text-text-secondary mb-4">{ladder.description}</p>

      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
          <span>İlerleme</span>
          <span>0 / {totalRungs} basamak</span>
        </div>
        <div className="h-2 bg-bg-card/50 rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: '0%' }} />
        </div>
      </div>

      <div className="flex gap-1.5 mb-4">
        {ladder.rungs.map((_rung, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-bg-card/50 text-text-secondary"
          >
            {i + 1}
          </div>
        ))}
      </div>

      <button
        onClick={() => onStart(ladder.rungs[0].exercise_id)}
        className="btn-primary w-full py-2.5 rounded-xl text-sm"
      >
        Başla
      </button>
    </div>
  );
}
