import { useMemo } from 'react';

interface HeatmapProps {
  data: { date: string; count: number }[];
}

export function ActivityHeatmap({ data }: HeatmapProps) {
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Build a map of date -> count
    const countMap = new Map<string, number>();
    for (const d of data) {
      countMap.set(d.date, d.count);
    }

    // Generate last 52 weeks of dates
    const result: { date: Date; count: number }[][] = [];
    let currentWeek: { date: Date; count: number }[] = [];

    // Start from 52 weeks ago
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);

    // Align to start of week (Sunday)
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const cursor = new Date(startDate);
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split('T')[0];
      const count = countMap.get(dateStr) ?? 0;
      currentWeek.push({ date: new Date(cursor), count });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      result.push(currentWeek);
    }

    return result;
  }, [data]);

  const maxCount = useMemo(() => {
    return Math.max(1, ...data.map(d => d.count));
  }, [data]);

  const getColor = (count: number): string => {
    if (count === 0) return 'bg-bg-card/50';
    const ratio = count / maxCount;
    if (ratio < 0.25) return 'bg-accent/20';
    if (ratio < 0.5) return 'bg-accent/40';
    if (ratio < 0.75) return 'bg-accent/60';
    return 'bg-accent';
  };

  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  const days = ['Pzt', '', 'Çar', '', 'Cum', '', 'Paz'];

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <h3 className="font-bold mb-4">Öğrenme Aktivitesi</h3>
      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5">
          {/* Month labels */}
          <div className="flex gap-0.5 ml-8 mb-1">
            {weeks.map((_, weekIdx) => {
              const firstDay = weeks[weekIdx]?.[0];
              const showMonth = firstDay && firstDay.date.getDate() <= 7;
              return (
                <div key={weekIdx} className="w-3 h-3 text-[8px] text-text-secondary flex items-start justify-center">
                  {showMonth ? months[firstDay.date.getMonth()] : ''}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          {days.map((dayLabel, dayIdx) => (
            <div key={dayIdx} className="flex gap-0.5 items-center">
              <div className="w-8 text-[9px] text-text-secondary text-right pr-1">{dayLabel}</div>
              {weeks.map((week, weekIdx) => {
                const cell = week[dayIdx];
                if (!cell) return <div key={weekIdx} className="w-3 h-3" />;
                return (
                  <div
                    key={weekIdx}
                    className={`w-3 h-3 rounded-sm ${getColor(cell.count)} transition-colors`}
                    title={`${cell.date.toLocaleDateString('tr-TR')}: ${cell.count} aktivite`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-4 text-xs text-text-secondary">
        <span>Az</span>
        <div className="w-3 h-3 rounded-sm bg-bg-card/50" />
        <div className="w-3 h-3 rounded-sm bg-accent/20" />
        <div className="w-3 h-3 rounded-sm bg-accent/40" />
        <div className="w-3 h-3 rounded-sm bg-accent/60" />
        <div className="w-3 h-3 rounded-sm bg-accent" />
        <span>Çok</span>
      </div>
    </div>
  );
}
