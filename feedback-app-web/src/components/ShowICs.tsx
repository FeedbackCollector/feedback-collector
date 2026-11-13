import { useMemo, useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { obtainAllICs } from '../service/ObtainICs';
import { obtainAllFeedback } from '../service/ObtainFeedback';
import FeedbackDashboard from './FeedbackDashboard';
import { UserAvatar } from '../components/UserAvatar';
import '../styles/ShowICs.css';
import AutocompleteSearch, { type SearchSuggestion } from './AutocompleteSearch';

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
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const shouldAnimateViewChange = useRef(false);

  const changeViewMode = (nextMode: ViewMode) => {
    if (nextMode === viewMode) return;

    shouldAnimateViewChange.current = true;
    setViewMode(nextMode);
  };

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');

    if (mediaQuery.matches) {
      setViewMode('cards');
    }

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setViewMode('cards');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);

  useEffect(() => {
    if (!shouldAnimateViewChange.current) return;

    shouldAnimateViewChange.current = false;
    viewContainerRef.current?.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 300, easing: 'ease-out' }
    );
  }, [viewMode]);

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
  const searchSuggestions = useMemo<SearchSuggestion[]>(
    () => ics.map((ic) => ({
      id: String(ic.IC_id),
      label: ic.name,
      value: ic.name,
      searchText: ic.title,
      detail: ic.title,
    })),
    [ics]
  );

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
            <AutocompleteSearch
              id="my-ics-search"
              className="team-search"
              label="Search individual contributors"
              placeholder="Search ICs..."
              value={search}
              suggestions={searchSuggestions}
              onChange={setSearch}
            />
            <div className="team-view-toggle" role="group" aria-label="IC view">
              <button
                type="button"
                className={viewMode === 'cards' ? 'is-active' : ''}
                aria-label="Card view"
                aria-pressed={viewMode === 'cards'}
                onClick={() => changeViewMode('cards')}
              >
                <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                  <path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z" />
                </svg>
              </button>
              <button
                type="button"
                className={viewMode === 'list' ? 'is-active' : ''}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => changeViewMode('list')}
              >
                <i className="fa-solid fa-table-list" aria-hidden="true" />
              </button>
            </div>
          </div>

          {visibleICs.length === 0 ? (
            <p className="team-empty">No ICs match your search.</p>
          ) : viewMode === 'cards' ? (
            <div className="team-metrics" ref={viewContainerRef}> 
              {visibleICs.map((item) => (
                <article className="team-metric-card" key={item.IC_id}>
                  <UserAvatar
                    name={item.name}
                    id={item.IC_id}
                    entityType="ic"
                    size={48}
                    className="team-metric-avatar"
                  />
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
            <div className="team-table-wrap" ref={viewContainerRef}>
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