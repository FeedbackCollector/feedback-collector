import { useEffect, useState } from 'react';
import { obtainManagers, type Manager } from '../service/ObtainManagers';
import '../styles/MyManagement.css';
import './ShowICs.css';

const AREA_NAMES: Record<number, string> = {
  1: 'Design',
  2: 'Delivery',
  3: 'Engineering',
  4: 'Product',
};

function getBadgeColor(score: number) {
  if (score < 2) return '#d31c37';
  if (score < 3) return '#e65100';
  if (score < 4) return '#e07b00';
  return '#55a613';
}

export default function MyManagementComp() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [totalICs, setTotalICs] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    obtainManagers()
      .then((result) => {
        if (!isCurrent) return;
        setManagers(result.managers);
        setTotalICs(result.totalICs);
        setAverageScore(result.averageScore);
      })
      .catch(() => {
        if (isCurrent) setError(true);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const metrics = [
    { label: 'Managers', value: loading ? '…' : error ? '—' : String(managers.length) },
    {
      label: 'Individual Contributors',
      value: loading ? '…' : error ? '—' : String(totalICs),
    },
    {
      label: 'Org-wide Average Score',
      value: loading
        ? '…'
        : error
          ? '—'
          : averageScore === null
            ? '0'
            : averageScore.toFixed(1),
    },
  ];

  return (
    <section className="my-management-page" aria-label="My Managers">
      <div className="my-management-metrics" aria-label="Organization overview">
        {metrics.map(({ label, value }) => (
          <article className="my-management-metric-card" key={label}>
            <h2>{label}</h2>
            <p>{value}</p>
          </article>
        ))}
      </div>

      <section className="team-page my-management-team" aria-label="All managers">
        <h2>All Managers</h2>
        {loading ? (
          <p className="my-management-state" role="status">Loading managers...</p>
        ) : error ? (
          <p className="my-management-state" role="alert">
            Could not load managers. Please try again later.
          </p>
        ) : managers.length === 0 ? (
          <p className="my-management-state">There are no managers to display yet.</p>
        ) : (
          <div className="team-metrics">
            {managers.map((manager) => (
              <article className="team-metric-card" key={manager.id}>
                <div className="team-metric-avatar" />
                <div className="team-metric-info">
                  <h3>{manager.name}</h3>
                  <p className="team-metric-role">
                    {manager.area_id === null
                      ? 'No area assigned'
                      : AREA_NAMES[manager.area_id] ?? `Area ${manager.area_id}`}
                  </p>
                  <div className="team-metric-badge-row">
                    {manager.averageScore === null ? (
                      <span className="my-management-no-data">No data</span>
                    ) : (
                      <span
                        className="team-metric-badge"
                        style={{ backgroundColor: getBadgeColor(manager.averageScore) }}
                      >
                        {Math.round(manager.averageScore)}
                      </span>
                    )}
                    <span className="team-metric-detail">{manager.icCount} ICs</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
