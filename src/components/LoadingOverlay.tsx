import { LoadingSpinner } from './LoadingSpinner';
import { useAppStore } from '../stores/appStore';

const DEFAULT_MESSAGES: Record<string, string> = {
  lesson: 'Ders yükleniyor...',
  exercise: 'Alıştırma hazırlanıyor...',
  game: 'Oyun başlatılıyor...',
  default: 'Yükleniyor...',
};

export function LoadingOverlay() {
  const { isLoading, loadingMessage } = useAppStore();

  if (!isLoading) return null;

  const displayMessage = loadingMessage || DEFAULT_MESSAGES.default;

  return (
    <div className="loading-overlay fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="loading-overlay-backdrop absolute inset-0" />
      
      {/* Content */}
      <div className="loading-overlay-content relative z-10 flex flex-col items-center gap-6">
        {/* Spinner */}
        <LoadingSpinner size="lg" />
        
        {/* Message */}
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-text-primary animate-fade-in">
            {displayMessage}
          </p>
          <p className="text-sm text-text-secondary animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Lütfen bekleyin...
          </p>
        </div>

        {/* Decorative Go stones */}
        <div className="loading-stones flex gap-4 mt-2">
          <div className="loading-stone loading-stone-black" />
          <div className="loading-stone loading-stone-white" />
        </div>
      </div>
    </div>
  );
}
