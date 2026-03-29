import { useEffect, useRef, useState } from 'react';

interface GameClockProps {
  timeRemaining: number;
  byoyomiPeriods?: number;
  byoyomiTime?: number;
  isActive: boolean;
  color: 'black' | 'white';
  onTimeUp?: () => void;
}

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GameClock({ timeRemaining, byoyomiPeriods, byoyomiTime, isActive, color, onTimeUp }: GameClockProps) {
  const [displayTime, setDisplayTime] = useState(timeRemaining);
  const lastTickRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayTime(timeRemaining);
    lastTickRef.current = performance.now();
  }, [timeRemaining, isActive]);

  useEffect(() => {
    if (!isActive || displayTime <= 0) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = (now: number) => {
      const elapsed = (now - lastTickRef.current) / 1000;
      if (elapsed >= 1) {
        lastTickRef.current = now;
        setDisplayTime(prev => {
          const next = prev - Math.floor(elapsed);
          if (next <= 0) {
            onTimeUp?.();
            return 0;
          }
          return next;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isActive, displayTime, onTimeUp]);

  const isLow = displayTime < 60 && displayTime > 0;
  const isCritical = displayTime < 10 && displayTime > 0;
  const isExpired = displayTime <= 0;

  const textColor = isExpired
    ? 'text-error'
    : isCritical
    ? 'text-error animate-pulse'
    : isLow
    ? 'text-warning'
    : color === 'black'
    ? 'text-text-primary'
    : 'text-text-primary';

  return (
    <div className={`flex flex-col items-center gap-0.5 ${isActive ? 'scale-105' : ''}`}>
      <div className={`text-lg font-bold font-mono tabular-nums ${textColor}`}>
        {formatTime(displayTime)}
      </div>
      {byoyomiPeriods !== undefined && byoyomiPeriods > 0 && displayTime <= 0 && (
        <div className="text-[10px] text-text-secondary">
          {byoyomiPeriods} x {byoyomiTime?.toFixed(0)}s
        </div>
      )}
    </div>
  );
}
