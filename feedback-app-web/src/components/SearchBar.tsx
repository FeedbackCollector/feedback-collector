import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DashboardData } from '../service/ObtainDashboard';

interface SearchResultItem {
  id: number;
  name: string;
  role: 'Manager' | 'IC';
}

interface SearchBarProps {
  data: DashboardData | null;
}

export function SearchBar({ data }: SearchBarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  const handleSelectPerson = (person: SearchResultItem) => {
    setSearchQuery('');
    setIsSearchOpen(false);

    if (person.role === 'Manager') {
      navigate(`/my-management/${person.id}`);
    } else {
      navigate(`/my-ics/${person.id}`);
    }
  };

  return (
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
        type="text"
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectPerson(person);
                }}
              >
                <span className="dashboard-search-name">{person.name}</span>
                <span className={`dashboard-search-badge is-${person.role.toLowerCase()}`}>
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
  );
}
