import { useEffect, useState } from 'react';
import type { DashboardData } from '../service/ObtainDashboard';
import { useDashboardCharts, type ChartBarItem } from '../service/DashboardStatistics';


interface DashboardStatsProps {
  data: DashboardData | null;
  selectedAreaId: number | null;
  loading: boolean;
}

function BarRow({
  item,
  animate,
}: {
  item: ChartBarItem;
  animate: boolean;
}) {
  return (
    <div className="dashboard-chart-row">
      <span className="dashboard-row-label">{item.label}</span>
      <div className="dashboard-bar-track">
        <div
          className="dashboard-bar-fill"
          style={{
            backgroundColor: item.color,
            width: animate ? `${item.percentage}%` : '0%',
          }}
        />
      </div>
      <span className="dashboard-row-value">{item.value}</span>
    </div>
  );
}

export function DashboardStats({
  data,
  selectedAreaId,
  loading,
}: DashboardStatsProps) {
  const { areaComparison, scoreDistribution } = useDashboardCharts(
    data,
    selectedAreaId
  );
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (!loading && data) {
      const frame = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(frame);
    }
    setAnimate(false);
  }, [loading, data, selectedAreaId]);

  if (loading || !data) {
    return null;
  }

  return (
    <div className="dashboard-stats" aria-label="Detailed statistics">
      
      {selectedAreaId === null && (
        <article className="dashboard-stats-card">
          <h2 className="dashboard-stats-title">Area Comparison</h2>
          <div className="dashboard-chart-list">
            {areaComparison.map((item) => (
              <BarRow key={item.id} item={item} animate={animate} />
            ))}
          </div>
        </article>
      )}

      
      <article className="dashboard-stats-card">
        <h2 className="dashboard-stats-title">Score Distribution</h2>
        <div className="dashboard-chart-list">
          {scoreDistribution.map((item) => (
            <BarRow key={item.id} item={item} animate={animate} />
          ))}
        </div>
      </article>
    </div>
  );
}
