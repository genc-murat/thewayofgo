export interface ModuleDef {
  id: number;
  title: string;
  lessonCount: number;
}

export interface LevelDef {
  id: number;
  title: string;
  description: string;
  modules: ModuleDef[];
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Başlangıç',
    description: "Go'nun temellerini öğrenin",
    modules: [
      { id: 1, title: "Go'nun Temelleri", lessonCount: 8 },
      { id: 2, title: 'Temel Kavramlar', lessonCount: 8 },
      { id: 3, title: 'İlk Oyununuz', lessonCount: 6 },
      { id: 4, title: 'Ko ve Skor', lessonCount: 6 },
      { id: 5, title: 'Tekrar', lessonCount: 4 },
    ],
  },
  {
    id: 2,
    title: 'Temel Teknikler',
    description: 'Yakalama teknikleri, bağlantılar ve tsumego',
    modules: [
      { id: 1, title: 'Esir Etme Teknikleri', lessonCount: 8 },
      { id: 2, title: 'Bağlantı Kurma', lessonCount: 4 },
      { id: 3, title: 'Tsumego (Yaşam ve Ölüm)', lessonCount: 8 },
      { id: 4, title: 'Oyun Sonu (Yose)', lessonCount: 6 },
      { id: 5, title: 'Uygulama', lessonCount: 8 },
      { id: 6, title: 'Çok Adımlı', lessonCount: 4 },
    ],
  },
  {
    id: 3,
    title: 'Orta Seviye',
    description: 'Strateji ve taktikler',
    modules: [
      { id: 1, title: 'Açılış (Fuseki)', lessonCount: 6 },
      { id: 2, title: 'Orta Oyun', lessonCount: 7 },
      { id: 3, title: 'Bitiriş (Yose)', lessonCount: 6 },
      { id: 4, title: 'Tesuji Kalıpları', lessonCount: 7 },
      { id: 5, title: 'Saldırı Savunma', lessonCount: 7 },
      { id: 6, title: 'İleri Tsumego', lessonCount: 6 },
    ],
  },
  {
    id: 4,
    title: 'İleri Seviye',
    description: 'Derin strateji',
    modules: [
      { id: 1, title: 'Joseki', lessonCount: 5 },
      { id: 2, title: 'Etki Alanları', lessonCount: 6 },
      { id: 3, title: 'Kalınlaştırma', lessonCount: 5 },
      { id: 4, title: 'İstila', lessonCount: 6 },
      { id: 5, title: 'Sentez', lessonCount: 6 },
      { id: 6, title: 'Derinlemesine', lessonCount: 7 },
    ],
  },
  {
    id: 5,
    title: 'Uzman',
    description: 'Profesyonel seviye kavramlar',
    modules: [
      { id: 1, title: 'İleri Okuma', lessonCount: 5 },
      { id: 2, title: 'Sabırlı Oyun', lessonCount: 5 },
      { id: 3, title: 'Denge', lessonCount: 5 },
      { id: 4, title: 'Karmaşık Dövüşler', lessonCount: 5 },
      { id: 5, title: 'Planlama', lessonCount: 7 },
    ],
  },
  {
    id: 6,
    title: 'Usta',
    description: 'Pro seviye eğitim',
    modules: [
      { id: 1, title: 'Pro Oyun Analizi', lessonCount: 5 },
      { id: 2, title: 'AI Stratejileri', lessonCount: 5 },
      { id: 3, title: 'Turnuva Hazırlık', lessonCount: 5 },
      { id: 4, title: 'Mentörlük', lessonCount: 5 },
      { id: 5, title: 'Usta Seviye', lessonCount: 10 },
    ],
  },
];

export function getAllLessonIds(): string[] {
  const ids: string[] = [];
  for (const level of LEVELS) {
    for (const mod of level.modules) {
      for (let l = 1; l <= mod.lessonCount; l++) {
        ids.push(`l${level.id}-${mod.id}-${l}`);
      }
    }
  }
  return ids;
}

export function getLessonsPerLevel(levelId: number): number {
  const level = LEVELS.find(l => l.id === levelId);
  return level?.modules.reduce((sum, m) => sum + m.lessonCount, 0) ?? 0;
}

export const LESSONS_PER_LEVEL: Record<number, number> = Object.fromEntries(
  LEVELS.map(l => [l.id, getLessonsPerLevel(l.id)])
);
