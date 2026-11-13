import { useMemo } from 'react';
import { calculateDashboardMetrics, type DashboardData } from './ObtainDashboard';

export interface ChartBarItem {
  id: string | number;
  label: string;
  value: string | number;
  percentage: number;
  color: string;
}

const SCORE_COLORS: Record<number, string> = {
  1: '#d90429', 
  2: '#e85d04', 
  3: '#d97706', 
  4: '#65a30d', 
  5: '#3f7d20', 
};

function getColorByAverage(avg: number): string {
  if (avg < 1.5) return SCORE_COLORS[1];
  if (avg < 2.5) return SCORE_COLORS[2];
  if (avg < 3.5) return SCORE_COLORS[3];
  if (avg < 4.5) return SCORE_COLORS[4];
  return SCORE_COLORS[5];
}

export function useDashboardCharts(
  data: DashboardData | null,
  selectedAreaId: number | null
) {
  return useMemo(() => {
    if (!data) {
      return { areaComparison: [], scoreDistribution: [] };
    }

   
    const areaComparison: ChartBarItem[] = data.areas.map((area) => {
      const metrics = calculateDashboardMetrics(data, area.id);
      const average = metrics.averageScore ?? 0;

      return {
        id: area.id,
        label: area.name,
        value: metrics.averageScore !== null ? average.toFixed(1) : '0.0',
        percentage: (average / 5) * 100,
        color: getColorByAverage(average),
      };
    });

    
    const allowedManagerIds = new Set(
      (selectedAreaId === null
        ? data.managers
        : data.managers.filter((m) => m.area_id === selectedAreaId)
      ).map((m) => m.id)
    );

    const allowedIcIds = new Set(
      data.ics
        .filter((ic) => allowedManagerIds.has(ic.manager_id))
        .map((ic) => ic.IC_id)
    );

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const item of data.feedback) {
      if (!allowedIcIds.has(item.ic_id)) continue;

      const roundedScore = Math.round(item.score);
      if (counts[roundedScore] !== undefined) {
        counts[roundedScore]++;
      }
    }

    const maxCount = Math.max(...Object.values(counts), 1);

    const scoreDistribution: ChartBarItem[] = [1, 2, 3, 4, 5].map((score) => ({
      id: score,
      label: `Score ${score}`,
      value: counts[score],
      percentage: (counts[score] / maxCount) * 95,
      color: SCORE_COLORS[score],
    }));

    return { areaComparison, scoreDistribution };
  }, [data, selectedAreaId]);
}
