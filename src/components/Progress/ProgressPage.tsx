export function ProgressPage() {
  const levels = [
    { level: 1, name: 'Başlangıç', progress: 17, color: 'bg-amber-500', glow: 'shadow-amber-500/20' },
    { level: 2, name: 'Temel Teknikler', progress: 0, color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
    { level: 3, name: 'Orta Seviye', progress: 0, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
    { level: 4, name: 'İleri Seviye', progress: 0, color: 'bg-purple-500', glow: 'shadow-purple-500/20' },
    { level: 5, name: 'Uzman', progress: 0, color: 'bg-rose-500', glow: 'shadow-rose-500/20' },
    { level: 6, name: 'Usta', progress: 0, color: 'bg-cyan-500', glow: 'shadow-cyan-500/20' },
  ];

  const stats = [
    { label: 'Tamamlanan Ders', value: '5', icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>, gradient: 'from-amber-500/20 to-amber-600/5' },
    { label: 'Alıştırma', value: '12', icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>, gradient: 'from-blue-500/20 to-blue-600/5' },
    { label: 'Toplam Yıldız', value: '24', icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.95-.69l1.07-3.292z" /></svg>, gradient: 'from-amber-400/20 to-yellow-600/5' },
    { label: 'Günlük Seri', value: '7', icon: <svg className="w-6 h-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" /></svg>, gradient: 'from-rose-500/20 to-orange-600/5' },
  ];

  const activities = [
    { text: 'Ders tamamlandı: Go Nedir?', time: '2 saat önce', type: 'lesson' as const },
    { text: 'Alıştırma yapıldı: Taşı Yakala', time: '1 saat önce', type: 'exercise' as const },
    { text: 'Oyun oynandı: 9x9 vs AI', time: '30 dk önce', type: 'game' as const },
    { text: 'Ders tamamlandı: Özgürlükler', time: '1 gün önce', type: 'lesson' as const },
  ];

  const activityIcons: Record<string, React.ReactNode> = {
    lesson: <svg className="w-5 h-5 text-accent" viewBox="0 0 20 20" fill="currentColor"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" /></svg>,
    exercise: <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" /></svg>,
    game: <svg className="w-5 h-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">İlerleme</h2>
        <p className="text-text-secondary">Öğrenme yolculuğunuzun özeti</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`glass rounded-2xl p-5 bg-gradient-to-br ${stat.gradient} border border-glass-border card-hover`}>
            <div className="text-text-secondary mb-3">{stat.icon}</div>
            <div className="text-3xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-text-secondary font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Level progress */}
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-6">Seviye İlerlemesi</h3>
        <div className="space-y-5">
          {levels.map((item) => (
            <div key={item.level}>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Seviye {item.level} - {item.name}</span>
                <span className={`text-xs font-semibold ${item.progress > 0 ? 'text-accent' : 'text-text-secondary'}`}>{item.progress}%</span>
              </div>
              <div className="h-2.5 bg-bg-primary/60 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full transition-all duration-1000 ${item.progress > 0 ? `${item.glow} shadow-lg` : ''}`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily goal */}
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-5">Günlük Hedef</h3>
        <div className="flex items-center gap-8">
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42 * 0.75} ${2 * Math.PI * 42}`}
                className="transition-all duration-1000" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xl font-bold">15</div>
                <div className="text-[10px] text-text-secondary">/ 20 dk</div>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary mb-3">
              Günlük hedefinize ulaşmak için <span className="text-accent font-semibold">5 dakika</span> daha çalışın.
            </p>
            <div className="h-2.5 bg-bg-primary/60 rounded-full overflow-hidden">
              <div className="h-full progress-bar-animated rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-5">Son Aktiviteler</h3>
        <div className="space-y-3">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-bg-primary/40 hover:bg-bg-primary/60 transition-colors">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
                {activityIcons[activity.type]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{activity.text}</div>
                <div className="text-xs text-text-secondary">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
