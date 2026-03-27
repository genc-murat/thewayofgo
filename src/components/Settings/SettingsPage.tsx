import { useState, useEffect } from 'react';

interface SettingsState {
  komi: number;
  showValidMovesDefault: boolean;
  showLastMove: boolean;
  autoSaveGames: boolean;
}

const DEFAULT_SETTINGS: SettingsState = {
  komi: 6.5,
  showValidMovesDefault: false,
  showLastMove: true,
  autoSaveGames: true,
};

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem('thewayofgo_settings');
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: SettingsState): void {
  try {
    localStorage.setItem('thewayofgo_settings', JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold mb-2">Ayarlar</h2>
        <p className="text-text-secondary">Oyun deneyiminizi özelleştirin</p>
      </div>

      {/* Game Settings */}
      <div className="glass rounded-2xl p-6 border border-glass-border space-y-6">
        <h3 className="font-bold text-lg">Oyun Ayarları</h3>

        <SettingRow
          label="Komi Değeri"
          description="Beyaz oyuncuya verilen ek puan (varsayılan: 6.5)"
        >
          <div className="flex gap-2">
            {[5.5, 6.5, 7.5].map(val => (
              <button
                key={val}
                onClick={() => update('komi', val)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.komi === val
                    ? 'gradient-accent text-bg-primary'
                    : 'glass text-text-secondary hover:text-text-primary'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow
          label="Geçerli Hamleleri Varsayılan Olarak Göster"
          description="Yeni oyunlarda geçerli hamle noktalarını otomatik göster"
        >
          <ToggleSwitch
            checked={settings.showValidMovesDefault}
            onChange={(val) => update('showValidMovesDefault', val)}
          />
        </SettingRow>

        <SettingRow
          label="Son Hamle İşaretini Göster"
          description="Son oynanan taş üzerinde turuncu halka göster"
        >
          <ToggleSwitch
            checked={settings.showLastMove}
            onChange={(val) => update('showLastMove', val)}
          />
        </SettingRow>

        <SettingRow
          label="Oyunları Otomatik Kaydet"
          description="Biten oyunları otomatik olarak geçmişe kaydet"
        >
          <ToggleSwitch
            checked={settings.autoSaveGames}
            onChange={(val) => update('autoSaveGames', val)}
          />
        </SettingRow>
      </div>

      {/* Data Management */}
      <div className="glass rounded-2xl p-6 border border-glass-border space-y-4">
        <h3 className="font-bold text-lg">Veri Yönetimi</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Ayarları Sıfırla</div>
            <div className="text-xs text-text-secondary">Tüm ayarları varsayılana döndür</div>
          </div>
          <button
            onClick={() => {
              setSettings(DEFAULT_SETTINGS);
              saveSettings(DEFAULT_SETTINGS);
            }}
            className="px-4 py-2 rounded-lg text-sm glass text-text-secondary hover:text-text-primary transition-all"
          >
            Sıfırla
          </button>
        </div>
      </div>

      {/* About */}
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold text-lg mb-3">Hakkında</h3>
        <div className="space-y-2 text-sm text-text-secondary">
          <p><strong className="text-text-primary">The Way of Go</strong> — Go öğrenmenin en iyi yolu</p>
          <p>Tauri + React + Rust ile geliştirildi</p>
          <p>MCTS yapay zeka motoru ile 5 zorluk seviyesi</p>
          <p>220+ alıştırma, 115 ders, 6 seviye müfredat</p>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-text-secondary">{description}</div>
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-all ${
        checked ? 'bg-accent' : 'bg-glass-border'
      }`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}
