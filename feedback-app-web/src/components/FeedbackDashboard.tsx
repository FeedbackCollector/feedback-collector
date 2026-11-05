import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
}

interface ICData {
  id: number;
  name: string;
  score: number | null;
  entries: number;
}

interface FeedbackDashboardProps {
  teamICs: ICData[];
  icComparisonData: ICData[];
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
  <div style={{ border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '8px', flex: 1, backgroundColor: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
    <div style={{ fontSize: '10px', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '500' }}>{title}</div>
    <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '4px', color: '#1a202c' }}>{value}</div>
  </div>
);

const ICComparisonRow: React.FC<ICData> = ({ name, score }) => {
  const percentage = score === null ? 0 : (score / 5) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '16px' }}>
      <div style={{ width: '120px', fontSize: '13px', color: '#2d3748' }}>{name}</div>
      <div style={{ flex: 1, backgroundColor: '#edf2f7', borderRadius: '4px', height: '6px' }}>
        <div style={{
          width: `${percentage}%`,
          backgroundColor: score === null || score < 3 ? '#dd6b20' : '#38a169',
          height: '100%',
          borderRadius: '4px'
        }} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: '600', width: '24px', textAlign: 'right', color: '#2d3748' }}>
        {score === null ? '—' : score.toFixed(1)}
      </div>
    </div>
  );
};

const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({ teamICs, icComparisonData }) => {
  const scoredICs = teamICs.filter((ic): ic is ICData & { score: number } => ic.score !== null);
  const teamAverageScore = scoredICs.length > 0
    ? scoredICs.reduce((sum, ic) => sum + ic.score, 0) / scoredICs.length
    : null;
  const totalEntries = teamICs.reduce((sum, ic) => sum + ic.entries, 0);

  const sortedICs = [...icComparisonData].sort(
    (first, second) => (second.score ?? -1) - (first.score ?? -1)
  );

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '24px', backgroundColor: '#f5f5f5' }}>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <MetricCard title="Team Average Score" value={teamAverageScore?.toFixed(1) ?? '—'} />
        <MetricCard title="Individual Contributors" value={teamICs.length} />
        <MetricCard title="Entries" value={totalEntries} />
      </div>

      <div style={{ backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', color: '#1a202c', fontWeight: '600' }}>IC Comparison</h3>
        {sortedICs.map((ic) => (
          <ICComparisonRow key={ic.id} {...ic} />
        ))}
      </div>
    </div>
  );
};

export default FeedbackDashboard;