import { useState } from 'react';

interface OnboardingProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<number | null>(null);
  const [dailyGoal, setDailyGoal] = useState(10);

  const handleComplete = () => {
    localStorage.setItem('thewayofgo_onboarded', 'true');
    localStorage.setItem('thewayofgo_level', String(level ?? 1));
    localStorage.setItem('thewayofgo_daily_goal', String(dailyGoal));
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    {
      content: (
        <div className="text-center">
          <div className="text-6xl mb-6">⚫⚪</div>
          <h2 className="text-3xl font-bold mb-4">The Way of Go'ya Hoş Geldiniz</h2>
          <p className="text-text-secondary text-lg max-w-md mx-auto mb-8">
            Go'yu öğrenmenin en iyi yolunu keşfetmeye hazır mısınız?
          </p>
          <button onClick={() => setStep(1)} className="btn-primary px-8 py-3 rounded-xl text-base">
            Başlayalım
          </button>
        </div>
      ),
    },
    // Step 1: Experience level
    {
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Go deneyiminiz nasıl?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { id: 1, label: 'Yeni Başlayan', desc: 'Go hakkında hiçbir şey bilmiyorum', icon: '🌱' },
              { id: 2, label: 'Orta Seviye', desc: 'Temel kuralları biliyorum, birkaç oyun oynadım', icon: '🌿' },
              { id: 3, label: 'İleri', desc: 'Düzenli oynuyorum, strateji öğrenmek istiyorum', icon: '🌳' },
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => { setLevel(opt.id); setStep(2); }}
                className={`p-5 rounded-xl border text-left transition-all ${
                  level === opt.id
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-glass-border bg-bg-primary/40 hover:border-accent/30'
                }`}
              >
                <div className="text-3xl mb-2">{opt.icon}</div>
                <div className="font-bold mb-1">{opt.label}</div>
                <div className="text-xs text-text-secondary">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>
      ),
    },
    // Step 2: Daily goal
    {
      content: (
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-6">Günlük hedefiniz nedir?</h2>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8">
            {[
              { val: 5, label: '5 alıştırma', desc: '~5 dakika' },
              { val: 10, label: '10 alıştırma', desc: '~10 dakika' },
              { val: 15, label: '15 alıştırma', desc: '~15 dakika' },
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => setDailyGoal(opt.val)}
                className={`p-4 rounded-xl border transition-all ${
                  dailyGoal === opt.val
                    ? 'border-accent/50 bg-accent/10'
                    : 'border-glass-border bg-bg-primary/40 hover:border-accent/30'
                }`}
              >
                <div className="text-2xl font-bold mb-1">{opt.val}</div>
                <div className="text-xs text-text-secondary">{opt.desc}</div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(3)} className="btn-primary px-8 py-3 rounded-xl">
            Devam Et
          </button>
        </div>
      ),
    },
    // Step 3: Ready
    {
      content: (
        <div className="text-center">
          <div className="text-5xl mb-6">🎉</div>
          <h2 className="text-2xl font-bold mb-4">Hazırsınız!</h2>
          <p className="text-text-secondary mb-8 max-w-md mx-auto">
            İlk dersinize başlayabilirsiniz. Her gün {dailyGoal} alıştırma hedefi belirledik.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleComplete}
              className="btn-primary px-8 py-3 rounded-xl text-base"
            >
              İlk Derse Başla
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-primary/95 backdrop-blur-sm">
      <div className="max-w-2xl w-full mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? 'bg-accent w-6' : i < step ? 'bg-accent/50' : 'bg-glass-border'
              }`}
            />
          ))}
        </div>

        <div className="animate-fade-in-up">
          {steps[step].content}
        </div>

        {step > 0 && step < steps.length - 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              ← Geri
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  return !localStorage.getItem('thewayofgo_onboarded');
}
