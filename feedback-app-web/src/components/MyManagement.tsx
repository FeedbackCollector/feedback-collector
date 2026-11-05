import { useEffect, useMemo, useState } from 'react';
import { obtainManagers, type Manager } from '../service/ObtainManagers';
import { obtainAreas, type Area } from '../service/ObtainAreas';
import { useAuthStore } from '../store/authStore';
import '../styles/MyManagement.css';

type ViewMode = 'cards' | 'list';

function getBadgeColor(score: number) {
  if (score < 2) return '#d31c37';
  if (score < 3) return '#e65100';
  if (score < 4) return '#e07b00';
  return '#55a613';
}

export default function MyManagementComp() {
  const token = useAuthStore((state) => state.token);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [totalICs, setTotalICs] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);
    setAreasError(null);

    Promise.allSettled([obtainManagers(token), obtainAreas()])
      .then(([managerResult, areaResult]) => {
        if (!isCurrent) return;
        if (managerResult.status === 'fulfilled') {
          setManagers(managerResult.value.managers);
          setTotalICs(managerResult.value.totalICs);
          setAverageScore(managerResult.value.averageScore);
        } else {
          const message = managerResult.reason instanceof Error
            ? managerResult.reason.message
            : String(managerResult.reason);
          console.error('Could not load managers:', managerResult.reason);
          setError(message);
        }

        if (areaResult.status === 'fulfilled') {
          setAreas(areaResult.value);
        } else {
          const message = areaResult.reason instanceof Error
            ? areaResult.reason.message
            : String(areaResult.reason);
          console.error('Could not load areas:', areaResult.reason);
          setAreasError(message);
        }
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  const areaNamesById = useMemo(
    () => new Map(areas.map((area) => [area.id, area.name])),
    [areas]
  );
  const getAreaName = (areaId: number | null) =>
    areaId === null ? 'No area assigned' : areaNamesById.get(areaId) ?? `Area ${areaId}`;

  const visibleManagers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return managers;
    return managers.filter((manager) =>
      `${manager.name} ${manager.email} ${getAreaName(manager.area_id)}`
        .toLocaleLowerCase()
        .includes(query)
    );
  }, [areaNamesById, managers, search]);

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

      <section className="my-management-team" aria-label="All managers">
        <h2>All Managers</h2>
        <div className="my-management-toolbar">
          <label className="my-management-search">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search Managers..."
              aria-label="Search managers"
            />
          </label>
          <div className="my-management-view-toggle" role="group" aria-label="Manager view">
            <button
              type="button"
              className={viewMode === 'cards' ? 'is-active' : ''}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'is-active' : ''}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <i className="fa-solid fa-table-list" aria-hidden="true" />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="my-management-state" role="status">Loading managers...</p>
        ) : error ? (
          <p className="my-management-state" role="alert">
            Could not load managers: {error}
          </p>
        ) : managers.length === 0 ? (
          <p className="my-management-state">There are no managers to display yet.</p>
        ) : (
          <>
            {areasError && (
              <p className="my-management-state" role="status">
                Could not load area names: {areasError}
              </p>
            )}
            <section className="my-management-comparison" aria-label="Manager comparison">
              <h3>Manager Comparison</h3>
              {visibleManagers.map((manager) => (
                <div className="my-management-comparison-row" key={manager.id}>
                  <span className="my-management-comparison-name">{manager.name}</span>
                  <span
                    className="my-management-score-track"
                    role="meter"
                    aria-label={`${manager.name} average score`}
                    aria-valuemin={0}
                    aria-valuemax={5}
                    aria-valuenow={manager.averageScore ?? 0}
                  >
                    <span
                      className="my-management-score-bar"
                      style={{
                        width: `${manager.averageScore === null ? 0 : Math.min(manager.averageScore / 5, 1) * 100}%`,
                        backgroundColor: manager.averageScore === null
                          ? 'transparent'
                          : getBadgeColor(manager.averageScore),
                      }}
                    />
                  </span>
                  <span className="my-management-comparison-score">
                    {manager.averageScore?.toFixed(1) ?? '0'}
                  </span>
                </div>
              ))}
              {visibleManagers.length === 0 && (
                <p className="my-management-empty">No managers match your search.</p>
              )}
            </section>

            {viewMode === 'cards' ? (
              <div className="my-management-manager-grid">
                {visibleManagers.map((manager) => (
                  <article className="my-management-manager-card" key={manager.id}>
                    <div className="my-management-avatar" aria-hidden="true" />
                    <div className="my-management-manager-info">
                      <h3>{manager.name}</h3>
                      <p className="my-management-area">
                        {getAreaName(manager.area_id)}
                      </p>
                      <div className="my-management-manager-meta">
                        {manager.averageScore === null ? (
                          <span className="my-management-no-data">No data</span>
                        ) : (
                          <span
                            className="my-management-score-badge"
                            style={{ backgroundColor: getBadgeColor(manager.averageScore) }}
                          >
                            {Math.round(manager.averageScore)}
                          </span>
                        )}
                        <span>{manager.icCount} ICs</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="my-management-table-wrap">
                <table className="my-management-table">
                  <thead>
                    <tr>
                      <th>Manager</th>
                      <th>Area</th>
                      <th>Score</th>
                      <th>ICs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleManagers.map((manager) => (
                      <tr key={manager.id}>
                        <td>{manager.name}</td>
                        <td>{getAreaName(manager.area_id)}</td>
                        <td>{manager.averageScore?.toFixed(1) ?? 'No data'}</td>
                        <td>{manager.icCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
