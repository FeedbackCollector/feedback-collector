import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { obtainAllICs } from '../service/ObtainICs';
import { obtainAllFeedback } from '../service/ObtainFeedback';
import { ICsMetricsRow, ICsComparisonCard } from './FeedbackDashboard';
import { UserAvatar } from '../components/UserAvatar';
import { useToastStore } from '../store/toastStore';
import LoadingOverlay from './LoadingOverlay';
import '../styles/ShowICs.css';
import AutocompleteSearch from './AutocompleteSearch';
import type { SearchSuggestion } from '../types/autoComplete';
import { normalizeSearchText } from '../utils/search';

type IC = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
  score: number | null;
};

type ViewMode = 'cards' | 'list';

function ObtainICs() {
  const navigate = useNavigate();
  const [ics, setIcs] = useState<IC[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (!loading && ics.length > 0) {
      setAnimateBars(false);
      const frame = requestAnimationFrame(() => setAnimateBars(true));
      return () => cancelAnimationFrame(frame);
    }
    setAnimateBars(false);
  }, [loading, ics, search]);

  const viewContainerRef = useRef<HTMLDivElement>(null);
  const shouldAnimateViewChange = useRef(false);

  const changeViewMode = (nextMode: ViewMode) => {
    if (nextMode === viewMode) return;

    shouldAnimateViewChange.current = true;
    setViewMode(nextMode);
  };

  function openICTimeline(item: IC) {
    navigate(`/my-ics/${item.IC_id}`);
  }

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

    obtainAllICs(managerId)
      .then((data) => {
        if (isCurrent) setIcs(data);
      })
      .catch((error) => {
        if (isCurrent) console.error('Error retrieving ICs:', error);
        useToastStore.getState().addToast('Error retrieving ICs. Please try again later.', 'error');
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
    const query = normalizeSearchText(search.trim());
    if (!query) return ics;
    return ics.filter((ic) =>
      normalizeSearchText(`${ic.name} ${ic.title}`).includes(query)
    );
  }, [ics, search]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(
    () => ics.map((ic) => ({
      id: String(ic.IC_id),
      label: ic.name,
      value: ic.name,
    })),
    [ics]
  );

  if (loading) {
    return <LoadingOverlay message="Loading ICs..." />;
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
    <div className="MyICs-containers">
      <section className="team-page">
        <ICsMetricsRow
          teamICs={ics.map(({ IC_id, name, score, entries }) => ({
            id: IC_id,
            name,
            score,
            entries,
          }))}
        />

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

        <ICsComparisonCard
          icComparisonData={visibleICs.map(({ IC_id, name, score, entries }) => ({
            id: IC_id,
            name,
            score,
            entries,
          }))}
        />

        {visibleICs.length === 0 ? (
          <p className="team-empty">No ICs match your search.</p>
        ) : viewMode === 'cards' ? (
          <div className="team-metrics" ref={viewContainerRef}>
            {visibleICs.map((item) => (
              <article
                className="team-metric-card"
                key={item.IC_id}
                onClick={() => openICTimeline(item)}
                style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
              >

                <div className="team-metric-info">
                  <h3>{item.name}</h3>
                  <p className="team-metric-role">{item.title}</p>

                  <div className="team-metric-badge-row">
                    {item.score === null ? (
                      <span className="team-no-score">No data</span>
                    ) : (
                      <span
                        className="team-metric-badge"
                        style={{ backgroundColor: getBadgeColor(item.score) }}
                      >
                        {Math.round(item.score)}
                      </span>
                    )}
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
                  <tr
                    key={item.IC_id}
                    onClick={() => openICTimeline(item)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ textDecoration: 'underline' }}>{item.name}</td>
                    <td>{item.title}</td>
                    <td>
                      {item.score === null ? (
                        <span className="team-no-score">No data</span>
                      ) : (
                        Math.round(item.score)
                      )}
                    </td>
                    <td>{item.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
                  <div className="team-metric-badge-row">
                    {item.score === null ? (
                      <span className="team-no-score">No data</span>
                    ) : (
                      <span
                        className="team-metric-badge"
                        style={{ backgroundColor: getBadgeColor(item.score) }}
                      >
                        {Math.round(item.score)}
                      </span>
                    )}
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
                  <tr
                    key={item.IC_id}
                    onClick={() => openICTimeline(item)}
                    style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ textDecoration: 'underline' }}>{item.name}</td>
                    <td>{item.title}</td>
                    <td>
                      {item.score === null ? (
                        <span className="team-no-score">No data</span>
                      ) : (
                        Math.round(item.score)
                      )}
                    </td>
                    <td>{item.entries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default ObtainICs;
