import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AccuracyChartProps {
  data: { date: string; accuracy: number }[];
}

export function AccuracyChart({ data }: AccuracyChartProps) {
  if (data.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 border border-glass-border">
        <h3 className="font-bold mb-2">Doğruluk Eğrisi</h3>
        <p className="text-sm text-text-secondary">Yeterli veri yok. Daha fazla alıştırma çözerek grafik oluşturun.</p>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    accuracy: item.accuracy,
  }));

  return (
    <div className="glass rounded-2xl p-6 border border-glass-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold">Doğruluk Eğrisi</h3>
        <span className={`text-sm font-medium ${chartData[chartData.length - 1].accuracy >= chartData[0].accuracy ? 'text-success' : 'text-error'}`}>
          {chartData[chartData.length - 1].accuracy >= chartData[0].accuracy ? '↑' : '↓'} %{(chartData[chartData.length - 1].accuracy - chartData[0].accuracy).toFixed(1)} değişim
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={({ index }) => (index % Math.max(1, Math.floor(chartData.length / 5)) === 0 ? chartData[index].date : '')} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}