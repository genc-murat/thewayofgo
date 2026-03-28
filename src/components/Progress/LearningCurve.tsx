import { useMemo } from 'react';

interface LearningCurveProps {
  data: { date: string; accuracy: number }[];
}

export function LearningCurve({ data }: LearningCurveProps) {
  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const maxAccuracy = 100;
    const width = 600;
    const height = 120;
    const padding = { top: 10, right: 10, bottom: 25, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - (d.accuracy / maxAccuracy) * chartHeight;
      return { x, y, ...d };
    });

    const pathD = points.length > 1
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
      : '';

    const areaD = points.length > 1
      ? pathD + ` L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
      : '';

    return { points, pathD, areaD, width, height, padding, chartHeight };
  }, [data]);

  if (!chartData || data.length < 2) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold mb-2">Öğrenme Eğrisi</h3>
        <p className="text-sm text-text-secondary">Yeterli veri yok. Daha fazla alıştırma çözerek grafik oluşturun.</p>
      </div>
    );
  }

  const { points, pathD, areaD, width, height, padding, chartHeight } = chartData;
  const lastAccuracy = data[data.length - 1]?.accuracy ?? 0;
  const firstAccuracy = data[0]?.accuracy ?? 0;
  const trend = lastAccuracy - firstAccuracy;

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Öğrenme Eğrisi</h3>
        <span className={`text-sm font-medium ${trend >= 0 ? 'text-success' : 'text-error'}`}>
          {trend >= 0 ? '↑' : '↓'} %{Math.abs(trend)} gelişim
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(v => {
          const y = padding.top + chartHeight - (v / 100) * chartHeight;
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-glass-border" strokeWidth="0.5" strokeDasharray="4 4" />
              <text x={padding.left - 5} y={y + 3} textAnchor="end" className="fill-text-secondary" fontSize="9">{v}%</text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaD && <path d={areaD} fill="url(#curveGradient)" opacity="0.3" />}

        {/* Line */}
        {pathD && <path d={pathD} fill="none" stroke="currentColor" className="text-accent" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" className="fill-accent" />
        ))}

        {/* Date labels */}
        {points.length > 0 && (
          <>
            <text x={points[0].x} y={height - 5} textAnchor="start" className="fill-text-secondary" fontSize="8">{data[0].date.slice(5)}</text>
            <text x={points[points.length - 1].x} y={height - 5} textAnchor="end" className="fill-text-secondary" fontSize="8">{data[data.length - 1].date.slice(5)}</text>
          </>
        )}

        <defs>
          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" className="text-accent" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" className="text-accent" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
