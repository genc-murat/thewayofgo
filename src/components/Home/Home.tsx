import { useState, useEffect } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getOverallProgress, getNextRecommendedLesson } from '../../utils/lessonPath';
import { StudyPlan } from '../Learn/StudyPlan';

const LEVEL_COLORS = [
  'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
  'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  'from-rose-500/20 to-rose-600/5 border-rose-500/30',
  'from-cyan-500/20 to-cyan-600/5 border-cyan-500/30',
];

const LEVEL_ACCENTS = [
  'text-amber-400',
  'text-blue-400',
  'text-emerald-400',
  'text-purple-400',
  'text-rose-400',
  'text-cyan-400',
];

const LEVEL_PROGRESS = [
  'bg-amber-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
];

const LEVEL_ICONS = [
  <svg key="l1" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>,
  <svg key="l2" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>,
  <svg key="l3" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>,
  <svg key="l4" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>,
  <svg key="l5" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" /></svg>,
  <svg key="l6" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z" /></svg>,
];

const LEVELS = [
  {
    id: 1,
    title: 'Başlangıç',
    description: "Go'nun temellerini öğrenin",
    modules: [
      { id: 1, title: "Go'nun Temelleri", lessons: 8, completed: 2 },
      { id: 2, title: 'Temel Kavramlar', lessons: 8, completed: 0 },
      { id: 3, title: 'İlk Oyununuz', lessons: 6, completed: 0 },
      { id: 4, title: 'Ko ve Skor', lessons: 6, completed: 0 },
      { id: 5, title: 'Tekrar', lessons: 4, completed: 0 },
    ],
  },
  {
    id: 2,
    title: 'Temel Teknikler',
    description: 'Yakalama teknikleri, bağlantılar ve tsumego',
    modules: [
      { id: 1, title: 'Esir Etme Teknikleri', lessons: 8, completed: 0 },
      { id: 2, title: 'Bağlantı Kurma', lessons: 4, completed: 0 },
      { id: 3, title: 'Tsumego (Yaşam ve Ölüm)', lessons: 8, completed: 0 },
      { id: 4, title: 'Oyun Sonu (Yose)', lessons: 6, completed: 0 },
      { id: 5, title: 'Uygulama', lessons: 8, completed: 0 },
      { id: 6, title: 'Çok Adımlı', lessons: 4, completed: 0 },
    ],
  },
  {
    id: 3,
    title: 'Orta Seviye',
    description: 'Strateji ve taktikler',
    modules: [
      { id: 1, title: 'Açılış (Fuseki)', lessons: 6, completed: 0 },
      { id: 2, title: 'Orta Oyun', lessons: 7, completed: 0 },
      { id: 3, title: 'Bitiriş (Yose)', lessons: 6, completed: 0 },
      { id: 4, title: 'Tesuji Kalıpları', lessons: 7, completed: 0 },
      { id: 5, title: 'Saldırı Savunma', lessons: 7, completed: 0 },
      { id: 6, title: 'İleri Tsumego', lessons: 6, completed: 0 },
    ],
  },
  {
    id: 4,
    title: 'İleri Seviye',
    description: 'Derin strateji',
    modules: [
      { id: 1, title: 'Joseki', lessons: 5, completed: 0 },
      { id: 2, title: 'Etki Alanları', lessons: 6, completed: 0 },
      { id: 3, title: 'Kalınlaştırma', lessons: 5, completed: 0 },
      { id: 4, title: 'İstila', lessons: 6, completed: 0 },
      { id: 5, title: 'Sentez', lessons: 6, completed: 0 },
      { id: 6, title: 'Derinlemesine', lessons: 7, completed: 0 },
    ],
  },
  {
    id: 5,
    title: 'Uzman',
    description: 'Profesyonel seviye kavramlar',
    modules: [
      { id: 1, title: 'İleri Okuma', lessons: 5, completed: 0 },
      { id: 2, title: 'Sabırlı Oyun', lessons: 5, completed: 0 },
      { id: 3, title: 'Denge', lessons: 5, completed: 0 },
      { id: 4, title: 'Karmaşık Dövüşler', lessons: 5, completed: 0 },
      { id: 5, title: 'Planlama', lessons: 7, completed: 0 },
    ],
  },
  {
    id: 6,
    title: 'Usta',
    description: 'Pro seviye eğitim',
    modules: [
      { id: 1, title: 'Pro Oyun Analizi', lessons: 5, completed: 0 },
      { id: 2, title: 'AI Stratejileri', lessons: 5, completed: 0 },
      { id: 3, title: 'Turnuva Hazırlık', lessons: 5, completed: 0 },
      { id: 4, title: 'Mentörlük', lessons: 5, completed: 0 },
      { id: 5, title: 'Usta Seviye', lessons: 10, completed: 0 },
    ],
  },
];

export function HomePage() {
  const { startAiGame, loadLesson, setLevel } = useAppStore();
  const [progress, setProgress] = useState<{
    lessonsCompleted: number;
    exercisesCorrect: number;
    currentLevel: number;
    levelProgress: Record<number, number>;
  } | null>(null);
  const [nextLesson, setNextLesson] = useState<{
    lessonId: string;
    level: number;
  } | null>(null);

  useEffect(() => {
    getOverallProgress().then(setProgress).catch(() => {});
    getNextRecommendedLesson().then((result) => {
      if (result) setNextLesson({ lessonId: result.lessonId, level: result.level });
    }).catch(() => {});
  }, []);

  const continueLessonId = nextLesson?.lessonId ?? 'l1-1-1';

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative text-center py-16 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-[10%] w-16 h-16 rounded-full bg-bg-card/30 blur-xl animate-float" />
          <div className="absolute top-20 right-[15%] w-12 h-12 rounded-full bg-accent/10 blur-lg animate-float-delayed" />
          <div className="absolute bottom-4 left-[40%] w-20 h-20 rounded-full bg-info/5 blur-xl animate-float" />
          <div className="absolute top-4 right-[35%] w-8 h-8 rounded-full bg-bg-card/20 blur-sm animate-float-delayed" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse-slow" />
            6 seviye, 33 modül, 200+ alıştırma
          </div>

          <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight animate-fade-in-up">
            Go Öğrenmenin
            <br />
            <span className="text-gradient">En İyi Yolu</span>
          </h2>

          <p className="text-text-secondary text-lg max-w-xl mx-auto mb-10 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            İnteraktif tahta, yapay zeka rakip ve adım adım eğitimlerle Go'yu sıfırdan ustalaşın.
          </p>

          <div className="flex gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={() => loadLesson(continueLessonId)} className="btn-primary text-base px-8 py-3.5 rounded-xl">
              {nextLesson ? 'Devam Et' : 'Öğrenmeye Başla'}
            </button>
            <button onClick={() => startAiGame(9, 1)} className="btn-secondary text-base px-8 py-3.5 rounded-xl">
              Yapay Zekaya Karşı Oyna
            </button>
          </div>
        </div>
      </section>

      {/* Study Plan */}
      <section>
        <StudyPlan />
      </section>

      {/* Level overview */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <h3 className="text-2xl font-bold">Müfredat</h3>
          <div className="flex-1 h-px bg-glass-border" />
          <span className="text-sm text-text-secondary">33 modül</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level, idx) => {
            const totalLessons = level.modules.reduce((sum, m) => sum + m.lessons, 0);
            const completedLessons = level.modules.reduce((sum, m) => sum + m.completed, 0);
            // Use real progress if available
            const realProgress = progress?.levelProgress?.[level.id] ?? 0;
            const progressPct = realProgress > 0 ? realProgress : (totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0);
            const isLocked = idx > 0 && (progress?.levelProgress?.[idx] ?? 0) < 30;
            const isComplete = progressPct >= 95;

            return (
              <button
                key={level.id}
                onClick={() => {
                  if (!isLocked) { setLevel(level.id, 1); loadLesson(`l${level.id}-1-1`); }
                }}
                disabled={isLocked}
                className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 border bg-gradient-to-br ${LEVEL_COLORS[idx]} ${
                  isLocked ? 'opacity-40 cursor-not-allowed' : 'card-hover cursor-pointer hover:border-opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-2.5 ${LEVEL_ACCENTS[idx]}`}>
                    {LEVEL_ICONS[idx]}
                    <span className="text-xs font-semibold tracking-wide uppercase opacity-80">
                      Seviye {level.id}
                    </span>
                  </div>
                  {isComplete && (
                    <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">Tamamlandı</span>
                  )}
                  {isLocked && (
                    <svg className="w-4 h-4 text-text-secondary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                <h4 className="font-bold text-lg mb-1 text-text-primary">{level.title}</h4>
                <p className="text-sm text-text-secondary mb-4">{level.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-text-secondary">
                    <span>{completedLessons}/{totalLessons} ders</span>
                    <span>{level.modules.length} modül</span>
                  </div>
                  <div className="h-1.5 bg-bg-primary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${LEVEL_PROGRESS[idx]}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {!isLocked && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {level.modules.slice(0, 3).map(m => (
                      <span key={m.id} className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/40 text-text-secondary">
                        {m.title}
                      </span>
                    ))}
                    {level.modules.length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-bg-primary/40 text-text-secondary">
                        +{level.modules.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick play */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <h3 className="text-2xl font-bold">Hızlı Oyun</h3>
          <div className="flex-1 h-px bg-glass-border" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { size: 9, label: '9x9 Başlangıç', desc: 'Hızlı oyun, ~10 dk', color: 'border-emerald-500/30' },
            { size: 13, label: '13x13 Orta', desc: 'Orta uzunluk, ~25 dk', color: 'border-blue-500/30' },
            { size: 19, label: '19x19 Tam', desc: 'Klasik oyun, ~45+ dk', color: 'border-purple-500/30' },
          ].map((option) => (
            <button
              key={option.size}
              onClick={() => startAiGame(option.size, 2)}
              className={`glass rounded-2xl p-6 text-left card-hover border ${option.color} transition-all`}
            >
              <div className="text-3xl font-bold mb-1 text-text-primary">{option.label}</div>
              <p className="text-sm text-text-secondary">{option.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-accent text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
                Oyna
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
