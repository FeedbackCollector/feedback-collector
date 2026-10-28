import { useState } from 'react';
import './Dashboard.css';

const AREAS = ['Design', 'Delivery', 'Engineering', 'Product'];

const MANAGER_COUNTS: Record<string, number> = {
  'All Areas': 8,
  Design: 2,
  Delivery: 1,
  Engineering: 3,
  Product: 2,
};

const BASE_METRICS = [
  { label: 'Individual Contributors', value: '24', detail: 'Contributors' },
  { label: 'Average Score', value: '4.6', detail: 'Out of 5' },
  { label: 'Entries', value: '86', detail: 'Feedback entries' },
];

export default function DashboardComp() {
  const [selectedArea, setSelectedArea] = useState('All Areas');
  const metrics = [
    ...(selectedArea === 'All Areas'
      ? [{ label: 'Areas', value: String(AREAS.length), detail: 'Total areas' }]
      : []),
    {
      label: 'Managers',
      value: String(MANAGER_COUNTS[selectedArea]),
      detail: selectedArea === 'All Areas' ? 'Across all areas' : `In ${selectedArea}`,
    },
    ...BASE_METRICS,
  ];

  return (
    <section className="dashboard-page" aria-label="Dashboard overview">
      <div className="dashboard-area-filter">
        <div className="dashboard-area-options" role="group" aria-label="Filter by area">
          {['All Areas', ...AREAS].map((area) => (
            <button
              key={area}
              type="button"
              className={`dashboard-area-button${selectedArea === area ? ' is-selected' : ''}`}
              aria-pressed={selectedArea === area}
              onClick={() => setSelectedArea(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-metrics" aria-label="Dashboard metrics">
        {metrics.map(({ label, value, detail }) => (
          <article className="dashboard-metric-card" key={label}>
            <h2>{label}</h2>
            <p className="dashboard-metric-value">{value}</p>
            <p className="dashboard-metric-detail">{detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
