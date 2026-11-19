import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { obtainManagers, type Manager } from '../service/ObtainManagers';
import { obtainAreas, type Area } from '../service/ObtainAreas';
import { useAuthStore } from '../store/authStore';
import '../styles/MyManagement.css';
import { UserAvatar } from './UserAvatar';
import LoadingOverlay from './LoadingOverlay';
import AutocompleteSearch from './AutocompleteSearch';
import type { SearchSuggestion } from '../types/autoComplete';
import { normalizeSearchText } from '../utils/search';
import { formatPersonName } from './formatPersonName';

type ViewMode = 'cards' | 'list';

const PAGE_SIZE = 10;
const arrowForward = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M8.03,22L6.25,20.23L14.48,12L6.25,3.77L8.03,2l10,10l-10,10Z"/></svg>;
const arrowBack = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M10,22L0,12L10,2l1.78,1.77L3.55,12l8.23,8.23L10,22Z"/></svg>;

function getBadgeColor(score: number) {
  if (score < 2) return '#d31c37';
  if (score < 3) return '#e65100';
  if (score < 4) return '#e07b00';
  return '#55a613';
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


export default function MyManagementComp() {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [totalICs, setTotalICs] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [areasError, setAreasError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    if (!loading && managers.length > 0) {
      setAnimateBars(false);
      const frame = requestAnimationFrame(() => setAnimateBars(true));
      return () => cancelAnimationFrame(frame);
    }
    setAnimateBars(false);
  }, [loading, managers, search]);
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
    const query = normalizeSearchText(search.trim());
    if (!query) return managers;
    return managers.filter((manager) =>
      normalizeSearchText(`${manager.name} ${manager.email} ${getAreaName(manager.area_id)}`)
        .includes(query)
    );
  }, [areaNamesById, managers, search]);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page'));
  const requestedPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const totalPages = Math.max(Math.ceil(visibleManagers.length / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, totalPages);
  const pagedManagers = visibleManagers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPage(next: number) {
    if (loading || next < 1 || next > totalPages || next === page) return;
    setSearchParams(next > 1 ? { page: String(next) } : {});
  }

  function openManagerTimeline(manager: Manager) {
    navigate(`/my-management/${manager.id}`);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchParams.has('page')) setSearchParams({}, { replace: true });
  }

  useEffect(() => {
    if (loading || requestedPage <= totalPages) return;
    setSearchParams(totalPages > 1 ? { page: String(totalPages) } : {}, { replace: true });
  }, [loading, requestedPage, totalPages, setSearchParams]);

  const searchSuggestions = useMemo<SearchSuggestion[]>(
    () => managers.map((manager) => {
      const areaName = manager.area_id === null
        ? 'No area assigned'
        : areaNamesById.get(manager.area_id) ?? `Area ${manager.area_id}`;
      const displayName = formatPersonName(manager.name);
      return {
        id: String(manager.id),
        label: displayName,
        value: displayName,
        searchText: areaName,
        detail: areaName,
      };
    }),
    [areaNamesById, managers]
  );

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
          <AutocompleteSearch
            id="my-managers-search"
            className="my-management-search"
            label="Search managers"
            placeholder="Search Managers..."
            value={search}
            suggestions={searchSuggestions}
            onChange={handleSearchChange}
          />
          <div className="my-management-view-toggle" role="group" aria-label="Manager view">
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

        {loading ? (
          <LoadingOverlay message="Loading managers..." />
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
              {pagedManagers.map((manager) => {
                const score = manager.averageScore ?? null;
                const percentage = score === null ? 0 : (score / 5) * 100;

                return (
                  <div className="my-management-comparison-row" key={manager.id}>
                    <span className="my-management-comparison-name">{formatPersonName(manager.name)}</span>
                    <span className="my-management-score-track">
                      <span
                        className="my-management-score-bar"
                        style={{
                          backgroundColor: getScoreColor(score),
                          width: animateBars ? `${percentage}%` : '0%',
                        }}
                      />
                    </span>
                    <span className="my-management-comparison-score">
                      {score === null ? '—' : score.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </section>


            {viewMode === 'cards' ? (
              <div className="my-management-manager-grid" ref={viewContainerRef}>
                {pagedManagers.map((manager) => (
                  <article
                    className="my-management-manager-card is-clickable"
                    key={manager.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Open feedback about ${manager.name}`}
                    onClick={() => openManagerTimeline(manager)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openManagerTimeline(manager);
                      }
                    }}
                  >
                    <UserAvatar
                      name={manager.name}
                      id={manager.id}
                      entityType="manager"
                      size={48}
                      className="team-metric-avatar"
                    />
                    <div className="my-management-manager-info">
                      <h3>{formatPersonName(manager.name)}</h3>
                      <p className="my-management-area">
                        {getAreaName(manager.area_id)}
                      </p>
                      <div className="my-management-manager-meta">
                        {manager.averageScore === null ? (
                          <span className="my-management-no-data">No data</span>
                        ) : (
                          <span
                            className="my-management-score-badge"
                            style={{ backgroundColor: getBadgeColor(Math.round(manager.averageScore)) }}
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
              <div className="my-management-table-wrap" ref={viewContainerRef}>
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
                    {pagedManagers.map((manager) => (
                                           <tr
                        key={manager.id}
                        className="is-clickable"
                        tabIndex={0}
                        onClick={() => openManagerTimeline(manager)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') openManagerTimeline(manager);
                        }}
                      >
                        <td className="my-management-link-cell">{formatPersonName(manager.name)}</td>

                        <td>{getAreaName(manager.area_id)}</td>
                        <td>
                          {manager.averageScore === null
                            ? <span className="my-management-no-data">No data</span>
                            : Math.round(manager.averageScore)}
                        </td>
                        <td>{manager.icCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {visibleManagers.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '16px 0 20px 0' }}>
                <button
                  type="button"
                  className="btn btn-icon btn-secondary"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  {arrowBack}
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-icon btn-secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  aria-label="Next page"
                  style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  {arrowForward}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </section>
  );
}
