
import { useAppStore } from '../../stores/appStore';
import { Board } from '../Board';

const LEVELS = [
  {
    id: 1,
    title: 'Başlangıç',
    description: 'Go\'nun temellerini öğrenin',
    modules: [
      { id: 1, title: 'Go\'nun Temelleri', lessons: 5, completed: 2 },
      { id: 2, title: 'Temel Kavramlar', lessons: 4, completed: 0 },
      { id: 3, title: 'İlk Oyununuz', lessons: 3, completed: 0 },
    ],
  },
  {
    id: 2,
    title: 'Temel Teknikler',
    description: 'Yakalama teknikleri, bağlantılar ve tsumego',
    modules: [
      { id: 1, title: 'Esir Etme Teknikleri', lessons: 5, completed: 0 },
      { id: 2, title: 'Bağlantı Kurma', lessons: 4, completed: 0 },
      { id: 3, title: 'Tsumego (Yaşam ve Ölüm)', lessons: 4, completed: 0 },
      { id: 4, title: 'Oyun Sonu (Yose)', lessons: 4, completed: 0 },
    ],
  },
  {
    id: 3,
    title: 'Orta Seviye',
    description: 'Strateji ve taktikler',
    modules: [
      { id: 1, title: 'Açılış (Fuseki)', lessons: 5, completed: 0 },
      { id: 2, title: 'Orta Oyun', lessons: 5, completed: 0 },
      { id: 3, title: 'Bitiriş (Yose)', lessons: 4, completed: 0 },
      { id: 4, title: 'Tesuji Kalıpları', lessons: 5, completed: 0 },
      { id: 5, title: 'Saldırı Savunma', lessons: 4, completed: 0 },
    ],
  },
  {
    id: 4,
    title: 'İleri Seviye',
    description: 'Derin strateji',
    modules: [
      { id: 1, title: 'Joseki', lessons: 5, completed: 0 },
      { id: 2, title: 'Etki Alanları', lessons: 4, completed: 0 },
      { id: 3, title: 'Kalınlaştırma', lessons: 4, completed: 0 },
      { id: 4, title: 'İstila', lessons: 5, completed: 0 },
      { id: 5, title: 'Sentez', lessons: 5, completed: 0 },
    ],
  },
  {
    id: 5,
    title: 'Uzman',
    description: 'Profesyonel seviye kavramlar',
    modules: [
      { id: 1, title: 'İleri Okuma', lessons: 5, completed: 0 },
      { id: 2, title: 'Sabırlı Oyun', lessons: 4, completed: 0 },
      { id: 3, title: 'Denge', lessons: 4, completed: 0 },
      { id: 4, title: 'Karmaşık Dövüşler', lessons: 5, completed: 0 },
    ],
  },
  {
    id: 6,
    title: 'Usta',
    description: 'Pro seviye eğitim',
    modules: [
      { id: 1, title: 'Pro Oyun Analizi', lessons: 5, completed: 0 },
      { id: 2, title: 'AI Stratejileri', lessons: 5, completed: 0 },
      { id: 3, title: 'Turnuva Hazırlık', lessons: 4, completed: 0 },
      { id: 4, title: 'Mentörlük', lessons: 5, completed: 0 },
    ],
  },
];

export function HomePage() {
  const { setView, startAiGame, loadLesson, setLevel } = useAppStore();

  return (
    <div className="space-y-8">
      {/* Hero section */}
      <section className="text-center py-12">
        <h2 className="text-4xl font-bold mb-4">
          Go Öğrenmenin <span className="text-accent">En İyi Yolu</span>
        </h2>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-8">
          6 seviye, 30 modül, 80+ ders ve 200+ alıştırma ile Go'yu sıfırdan öğrenin.
          İnteraktif tahta, yapay zeka rakip ve adım adım eğitimlerle ustalaşın.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => loadLesson('l1-1-1')}
            className="bg-accent hover:bg-accent-hover text-black font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Öğrenmeye Başla
          </button>
          <button
            onClick={() => startAiGame(9, 1)}
            className="bg-bg-card hover:bg-bg-secondary border border-accent text-accent font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Yapay Zekaya Karşı Oyna
          </button>
        </div>
      </section>

      {/* Quick board preview */}
      <section className="flex justify-center">
        <div className="w-64">
          <Board
            size={9}
            board={Array(9).fill(null).map(() => Array(9).fill(null))}
            showCoordinates={false}
          />
        </div>
      </section>

      {/* Level overview */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Müfredat</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const totalLessons = level.modules.reduce((sum, m) => sum + m.lessons, 0);
            const completedLessons = level.modules.reduce((sum, m) => sum + m.completed, 0);
            const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

            return (
              <button
                key={level.id}
                onClick={() => {
                  setLevel(level.id, 1);
                  setView('learn');
                }}
                className="bg-bg-card hover:bg-bg-secondary border border-transparent hover:border-accent rounded-xl p-5 text-left transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded">
                    Seviye {level.id}
                  </span>
                  <span className="text-xs text-text-secondary">
                    {completedLessons}/{totalLessons} ders
                  </span>
                </div>
                <h4 className="font-semibold mb-1">{level.title}</h4>
                <p className="text-sm text-text-secondary mb-3">{level.description}</p>
                <div className="h-1.5 bg-bg-primary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Quick play section */}
      <section>
        <h3 className="text-2xl font-bold mb-6">Hızlı Oyun</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { size: 9, label: '9x9 Başlangıç', desc: 'Hızlı oyun, ~10 dakika' },
            { size: 13, label: '13x3 Orta', desc: 'Orta uzunluk, ~25 dakika' },
            { size: 19, label: '19x19 Tam', desc: 'Klasik oyun, ~45+ dakika' },
          ].map((option) => (
            <button
              key={option.size}
              onClick={() => startAiGame(option.size, 2)}
              className="bg-bg-card hover:bg-bg-secondary border border-transparent hover:border-accent rounded-xl p-5 text-left transition-all"
            >
              <h4 className="font-semibold mb-1">{option.label}</h4>
              <p className="text-sm text-text-secondary">{option.desc}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
