import { useMemo, useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { obtainAllICs } from '../service/ObtainICs';
import { obtainAllFeedback } from '../service/ObtainFeedback';
import FeedbackDashboard from './FeedbackDashboard';
import '../styles/ShowICs.css';

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
  score: number | null;
};

type ViewMode = 'cards' | 'list';

function ObtainICs() {
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let isCurrent = true;
    const managerId = user?.role.toLowerCase() === 'director' ? undefined : user?.id;

    if (!token || (managerId === undefined && user?.role.toLowerCase() !== 'director')) {
      setIcs([]);
      setLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    setLoading(true);
    setIcs([]);

    Promise.all([obtainAllICs(managerId), obtainAllFeedback()])
      .then(([data, feedback]) => {
        if (!isCurrent) return;

        const scoresByIC = new Map<number, number[]>();
        for (const item of feedback) {
          const scores = scoresByIC.get(item.ic_id) ?? [];
          scores.push(item.score);
          scoresByIC.set(item.ic_id, scores);
        }

        setIcs(data.map((ic) => {
          const scores = scoresByIC.get(ic.IC_id) ?? [];
          return {
            ...ic,
            score: scores.length > 0
              ? scores.reduce((sum, score) => sum + score, 0) / scores.length
              : null,
          };
        }));
      })
      .catch((error) => {
        if (isCurrent) console.error('Error retrieving ICs:', error);
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token, user?.id, user?.role]);

  const getBadgeColor = (score: number | null) => {
    switch (score === null ? null : Math.round(score)) {
      case 1: return '#d31c37';
      case 2: return '#e65100';
      case 3: return '#e07b00';
      case 4: return '#55a613';
      case 5: return '#1b7800';
      default: return '#94a3b8';
    }
  };

  const visibleICs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return ics;
    return ics.filter((ic) =>
      `${ic.name} ${ic.title}`.toLocaleLowerCase().includes(query)
    );
  }, [ics, search]);

  if (loading) {
    return <p>Loading data...</p>;
  }

  if (ics.length === 0) {
    return (
      <div className="MyICs-containers">
        <div className="show-ics-empty">
          <i className="fa-solid fa-user-group"></i>
          <p>You don't have any Individual Contributors assigned yet. The Director assigns ICs to each manager.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <FeedbackDashboard
        teamICs={ics.map(({ IC_id, name, score, entries }) => ({
          id: IC_id,
          name,
          score,
          entries,
        }))}
        icComparisonData={visibleICs.map(({ IC_id, name, score, entries }) => ({
          id: IC_id,
          name,
          score,
          entries,
        }))}
      />
      <div className="MyICs-containers">
        <section className="team-page">
          <h2>Your Team</h2>
          <div className="team-toolbar">
            <label className="team-search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ICs..."
                aria-label="Search individual contributors"
              />
            </label>
            <div className="team-view-toggle" role="group" aria-label="IC view">
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

          {visibleICs.length === 0 ? (
            <p className="team-empty">No ICs match your search.</p>
          ) : viewMode === 'cards' ? (
            <div className="team-metrics">
              {visibleICs.map((item) => (
                <article className="team-metric-card" key={item.IC_id}>
                  <div className="team-metric-avatar" />

                  <div className="team-metric-info">
                    <h3>{item.name}</h3>
                    <p className="team-metric-role">{item.title}</p>

                    <div className="team-metric-badge-row">
                      <span
                        className="team-metric-badge"
                        style={{ backgroundColor: getBadgeColor(item.score) }}
                      >
                        {item.score === null ? '—' : Math.round(item.score)}
                      </span>
                      <span className="team-metric-detail">{item.entries} entries</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="team-table-wrap">
              <table className="team-table">
                <thead>
                  <tr>
                    <th>IC</th>
                    <th>Title</th>
                    <th>Score</th>
                    <th>Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleICs.map((item) => (
                    <tr key={item.IC_id}>
                      <td>{item.name}</td>
                      <td>{item.title}</td>
                      <td>{item.score?.toFixed(1) ?? 'No data'}</td>
                      <td>{item.entries}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default ObtainICs;