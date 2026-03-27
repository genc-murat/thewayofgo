export function ProgressPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">İlerleme</h2>

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Tamamlanan Ders" value="5" icon="📚" />
        <StatCard label="Tamamlanan Alıştırma" value="12" icon="✏️" />
        <StatCard label="Toplam Yıldız" value="24" icon="⭐" />
        <StatCard label="Günlük Seri" value="7 gün" icon="🔥" />
      </div>

      {/* Level progress */}
      <div className="bg-bg-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Seviye İlerlemesi</h3>
        <div className="space-y-4">
          {[
            { level: 1, name: 'Başlangıç', progress: 40 },
            { level: 2, name: 'Temel Teknikler', progress: 0 },
            { level: 3, name: 'Orta Seviye', progress: 0 },
            { level: 4, name: 'İleri Seviye', progress: 0 },
            { level: 5, name: 'Uzman', progress: 0 },
            { level: 6, name: 'Usta', progress: 0 },
          ].map((item) => (
            <div key={item.level}>
              <div className="flex justify-between text-sm mb-1">
                <span>
                  Seviye {item.level} - {item.name}
                </span>
                <span className="text-text-secondary">{item.progress}%</span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-bg-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Son Aktiviteler</h3>
        <div className="space-y-3">
          {[
            { text: 'Ders tamamlandı: Go Nedir?', time: '2 saat önce', type: 'lesson' },
            { text: 'Alıştırma yapıldı: Doğru Hamleyi Bul', time: '1 saat önce', type: 'exercise' },
            { text: 'Oyun oynandı: 9x9 vs AI', time: '30 dk önce', type: 'game' },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 bg-bg-primary rounded-lg"
            >
              <span className="text-lg">
                {activity.type === 'lesson' ? '📚' : activity.type === 'exercise' ? '✏️' : '🎮'}
              </span>
              <div className="flex-1">
                <div className="text-sm">{activity.text}</div>
                <div className="text-xs text-text-secondary">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily goal */}
      <div className="bg-bg-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Günlük Hedef</h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full border-4 border-accent flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">15</div>
              <div className="text-xs text-text-secondary">/ 20 dk</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-text-secondary mb-2">
              Günlük hedefinize ulaşmak için 5 dakika daha çalışın.
            </p>
            <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '75%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="bg-bg-card rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-text-secondary">{label}</div>
    </div>
  );
}
