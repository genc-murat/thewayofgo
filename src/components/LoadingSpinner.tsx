interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent border-r-accent/50 animate-spin-slow" />
      
      {/* Inner Go stone effect */}
      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-accent to-accent/60 animate-pulse-slow opacity-80" />
      
      {/* Center glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1/3 h-1/3 rounded-full bg-accent/30 blur-sm animate-pulse" />
      </div>
    </div>
  );
}
