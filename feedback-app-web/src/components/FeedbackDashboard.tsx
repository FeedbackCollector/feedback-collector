import React from 'react';
import '../styles/FeedbackDashboardMyIcs.css';

interface MetricCardProps {
  title: string;
  value: string | number;
}

export interface ICData {
  id: number;
  name: string;
  score: number | null;
  entries: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
  <div className="metricCard">
    <div className="metricTitle">{title}</div>
    <div className="metricValue">{value}</div>
  </div>
);

const ICComparisonRow: React.FC<ICData> = ({ name, score }) => {
  const percentage = score === null ? 0 : (score / 5) * 100;
  const isLowScore = score === null || score < 3;

  return (
    <div className="comparisonRow">
      <div className="icName">{name}</div>
      <div className="progressTrack">
        <div
          className={`progressBar ${isLowScore ? 'barLow' : 'barHigh'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="icScore">
        {score === null ? '—' : score.toFixed(1)}
      </div>
    </div>
  );
};

export const ICsMetricsRow: React.FC<{ teamICs: ICData[] }> = ({ teamICs }) => {
  const scoredICs = teamICs.filter((ic): ic is ICData & { score: number } => ic.score !== null);
  const teamAverageScore = scoredICs.length > 0
    ? scoredICs.reduce((sum, ic) => sum + ic.score, 0) / scoredICs.length
    : null;
  const totalEntries = teamICs.reduce((sum, ic) => sum + ic.entries, 0);

  return (
    <div className="metricsGrid">
      <MetricCard title="Team Average Score" value={teamAverageScore?.toFixed(1) ?? '—'} />
      <MetricCard title="Individual Contributors" value={teamICs.length} />
      <MetricCard title="Entries" value={totalEntries} />
    </div>
  );
};

export const ICsComparisonCard: React.FC<{ icComparisonData: ICData[] }> = ({ icComparisonData }) => {
  const sortedICs = [...icComparisonData].sort(
    (first, second) => (second.score ?? -1) - (first.score ?? -1)
  );

  return (
    <div className="comparisonSection">
      <h3 className="sectionTitle">IC Comparison</h3>
      {sortedICs.map((ic) => (
        <ICComparisonRow key={ic.id} {...ic} />
      ))}
    </div>
  );
};
