import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  calculateDashboardMetrics,
  obtainDashboardData,
  type DashboardData,
} from '../service/ObtainDashboard';
import '../styles/Dashboard.css';

interface SearchResultItem {
  id: number;
  name: string;
  role: 'Manager' | 'IC';
}

export default function DashboardComp() {
  const token = useAuthStore((state) => state.token);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    if (!token) {
      setLoading(false);
      setError('There is no active session. Log in again to see the dashboard.');
      return () => {
        isCurrent = false;
      };
    }

    setLoading(true);
    setError(null);

    obtainDashboardData()
      .then((result) => {
        if (isCurrent) setData(result);
      })
      .catch((reason) => {
        console.error('Could not load the dashboard:', reason);
        if (isCurrent) setError(reason instanceof Error ? reason.message : 'Unknown error.');
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [token]);

  
  const searchResults = useMemo<SearchResultItem[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !data) return [];

    const matchedManagers: SearchResultItem[] = data.managers
      .filter((manager) => manager.name?.toLowerCase().includes(query))
      .map((manager) => ({
        id: manager.id,
        name: manager.name,
        role: 'Manager',
      }));

    const matchedICs: SearchResultItem[] = data.ics
      .filter((ic) => ic.name?.toLowerCase().includes(query))
      .map((ic) => ({
        id: ic.IC_id,
        name: ic.name,
        role: 'IC',
      }));

    return [...matchedManagers, ...matchedICs];
  }, [searchQuery, data]);

  const areas = data?.areas ?? [];
  const selectedArea = areas.find((area) => area.id === selectedAreaId) ?? null;
  const calculated = useMemo(
    () => (data ? calculateDashboardMetrics(data, selectedArea?.id ?? null) : null),
    [data, selectedArea?.id]
  );

  const show = (value: string) => (loading ? '…' : error || !calculated ? '—' : value);
  const metrics = [
    ...(selectedArea === null
      ? [{ label: 'Areas', value: show(String(areas.length)), detail: 'Total areas' }]
      : []),
    {
      label: 'Managers',
      value: show(String(calculated?.managers ?? 0)),
      detail: selectedArea === null ? 'Across all areas' : `In ${selectedArea.name}`,
    },
    {
      label: 'Individual Contributors',
      value: show(String(calculated?.ics ?? 0)),
      detail: 'Contributors',
    },
    {
      label: 'Average Score',
      value: show(calculated?.averageScore == null ? '—' : calculated.averageScore.toFixed(1)),
      detail: 'Out of 5',
    },
    {
      label: 'Entries',
      value: show(String(calculated?.entries ?? 0)),
      detail: 'Feedback entries',
    },
  ];

  const handleSelectPerson = (person: SearchResultItem) => {
    setSearchQuery(person.name);
    setIsSearchOpen(false);

  };

  return (
    <section className="dashboard-page" aria-label="Dashboard overview">
      <div className="dashboard-search">
        <svg
          className="dashboard-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          className="dashboard-search-input"
          placeholder="Search ICs or Managers..."
          aria-label="Search ICs or Managers"
          value={searchQuery}
          onFocus={() => setIsSearchOpen(true)}
          onBlur={() => setTimeout(() => setIsSearchOpen(false), 150)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
        />

        {isSearchOpen && searchQuery.trim() !== '' && (
          <ul className="dashboard-search-dropdown" role="listbox">
            {searchResults.length > 0 ? (
              searchResults.map((person) => (
                <li
                  key={`${person.role}-${person.id}`}
                  className="dashboard-search-item"
                  role="option"
                  onMouseDown={() => handleSelectPerson(person)}
                >
                  <span className="dashboard-search-name">{person.name}</span>
                  <span
                    className={`dashboard-search-badge is-${person.role.toLowerCase()}`}
                  >
                    {person.role}
                  </span>
                </li>
              ))
            ) : (
              <li className="dashboard-search-empty">No results found</li>
            )}
          </ul>
        )}
      </div>

      <div className="dashboard-area-filter">
        <div className="dashboard-area-options" role="group" aria-label="Filter by area">
          <button
            type="button"
            className={`dashboard-area-button${selectedArea === null ? ' is-selected' : ''}`}
            aria-pressed={selectedArea === null}
            onClick={() => setSelectedAreaId(null)}
          >
            All Areas
          </button>
          {areas.map((area) => (
            <button
              key={area.id}
              type="button"
              className={`dashboard-area-button${selectedArea?.id === area.id ? ' is-selected' : ''}`}
              aria-pressed={selectedArea?.id === area.id}
              onClick={() => setSelectedAreaId(area.id)}
            >
              {area.name}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="dashboard-state is-error" role="alert">
          Could not load the dashboard: {error}
        </p>
      )}

      <div className="dashboard-metrics" aria-label="Dashboard metrics" aria-busy={loading}>
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
