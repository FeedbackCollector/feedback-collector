import React, { useEffect, useState } from 'react';
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

const SCORE_COLORS: Record<number, string> = {
1: '#E12339',
2: '#EA580C',
3: '#D97706',
4: '#65A30D',
5: '#2B8000',
};

function getScoreColor(score: number | null): string {
if (score === null) return '#94a3b8';
if (score < 1.5) return SCORE_COLORS[1];
if (score < 2.5) return SCORE_COLORS[2];
if (score < 3.5) return SCORE_COLORS[3];
if (score < 4.5) return SCORE_COLORS[4];
return SCORE_COLORS[5];
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => (
<div className="metricCard">
<div className="metricTitle">{title}</div>
<div className="metricValue">{value}</div>
</div>
);

const ICComparisonRow: React.FC<ICData & { animate: boolean }> = ({
name,
score,
animate,
}) => {
const percentage = score === null ? 0 : (score / 5) * 100;

return (
<div className="comparisonRow">
<div className="icName">{name}</div>
<div className="progressTrack">
<div
className="progressBar"
style={{
backgroundColor: getScoreColor(score),
width: animate ? `${percentage}%` : '0%',
}}
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
const [animate, setAnimate] = useState(false);

useEffect(() => {
setAnimate(false);
const frame = requestAnimationFrame(() => setAnimate(true));
return () => cancelAnimationFrame(frame);
}, [icComparisonData]);

const sortedICs = [...icComparisonData].sort(
(first, second) => (second.score ?? -1) - (first.score ?? -1)
);

return (
<div className="comparisonSection">
<h3 className="sectionTitle">IC Comparison</h3>
{sortedICs.map((ic) => (
<ICComparisonRow key={ic.id} {...ic} animate={animate} />
))}
</div>
);
};