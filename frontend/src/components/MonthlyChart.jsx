import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { money } from '../utils/format';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function MonthlyChart({ data, inLabel = 'Money in', outLabel = 'Money out' }) {
  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      { label: inLabel, data: data.map((d) => Number(d.income)), backgroundColor: '#1E9E6A', borderRadius: 4, maxBarThickness: 28 },
      { label: outLabel, data: data.map((d) => Number(d.spending)), backgroundColor: '#1F5FD1', borderRadius: 4, maxBarThickness: 28 },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: { family: 'Manrope' } } },
      tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${money(c.parsed.y)}` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { family: 'Manrope' } } },
      y: { beginAtZero: true, ticks: { callback: (v) => (v >= 1000 ? `${v / 1000}k` : v), font: { family: 'Manrope' } } },
    },
  };
  return (
    <div className="chart-box" role="img" aria-label="Bar chart of the last six months of money in and money out">
      <Bar data={chartData} options={options} />
    </div>
  );
}
