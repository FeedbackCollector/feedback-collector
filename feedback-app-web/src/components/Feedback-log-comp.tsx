import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters, IC, Project } from '../types/feedback';
import { obtainICs } from '../service/ObtainICs';
import { obtainProjects } from '../service/ObtainProjects';
import '../styles/index.css'
import { obtainFeedbackPage } from '../service/ObtainFeedback';
import ICView from './IcView';
import ScreenshotThumb from './ScreenshotThumb';
import AutocompleteSearch from './AutocompleteSearch';
import type { SearchSuggestion } from '../types/autoComplete';
import '../styles/index.css'

const SEARCH_DEBOUNCE_MS = 300;
const PAGE_SIZE = 10;
const SCORES = [1,2,3,4,5];


const searchIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
const tableChartIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z"/></svg>
const viewListIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg>
const arrowForward = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M8.03,22L6.25,20.23L14.48,12L6.25,3.77L8.03,2l10,10l-10,10Z"/></svg>
const arrowBack = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M10,22L0,12L10,2l1.78,1.77L3.55,12l8.23,8.23L10,22Z"/></svg>

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [ics, setIcs] = useState<IC[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedIC, setSelectedIC] = useState<{
    IC_id: number;
    name: string;
    title: string;
    entries: number;
  } | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<FeedbackFilters>({
    icName: '',
    projectId: '',
    score: '',
    sortBy: 'newest',
    text: '',
  });
  const [searchInputs, setSearchInputs] = useState({ icName: '', text: '' });
  const feedbackContainerRef = useRef<HTMLDivElement>(null);

  const shouldAnimateViewChange = useRef(false);

  function changeViewMode(nextMode: 'table' | 'list') {
    if (nextMode === viewMode) return;

    shouldAnimateViewChange.current = true;
    setViewMode(nextMode);
  }

  useEffect(() => {
  const mediaQuery = window.matchMedia('(max-width: 767px)');

  if (mediaQuery.matches) {
    setViewMode('list');
  }

  const handleMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      setViewMode('list');
    }
  }; 
  mediaQuery.addEventListener('change', handleMediaChange);
  return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);
  

  useEffect(() => {
  const mediaQuery = window.matchMedia('(max-width: 767px)');

  if (mediaQuery.matches) {
    setViewMode('list');
  }

  const handleMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      setViewMode('list');
    }
  }; 
  mediaQuery.addEventListener('change', handleMediaChange);
  return () => mediaQuery.removeEventListener('change', handleMediaChange);
  }, []);
  

  useEffect(() => {
    async function loadReferences() {
      try {
        const [icsData, projectsData] = await Promise.all([obtainICs(), obtainProjects()]);
        setIcs(icsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadReferences();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function loadFeedback() {
      setLoading(true);
      setLoadError(null);
      try {
        const result = await obtainFeedbackPage(page, PAGE_SIZE, filters, controller.signal);
        if (cancelled) return;
        setFeedback(result.data ?? []);
        setTotalPages(Math.max(result.pagination.totalPages, 1));
        setTotalItems(result.pagination.total);
      } catch (error) {
        if (cancelled) return;
        console.error('Error retrieving feedback:', error);
        setLoadError('Could not load feedback. Please try again.');
        setFeedback([]);
        setTotalPages(1);
        setTotalItems(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFeedback();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [page, filters]);

  useEffect(() => {
    if (!shouldAnimateViewChange.current) return;

    shouldAnimateViewChange.current = false;
    const element = feedbackContainerRef.current;
    if (!element) return;

    element.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 300, easing: 'ease-out' }
    );
  }, [viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (filters.icName === searchInputs.icName && filters.text === searchInputs.text) return;
      setLoading(true);
      setPage(1);
      setFilters((current) => ({ ...current, icName: searchInputs.icName, text: searchInputs.text }));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInputs]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'icName' || name === 'text') {
      setSearchInputs((current) => ({ ...current, [name]: value }));
      return;
    }
    if (name === 'sortBy' && value !== 'newest' && value !== 'oldest') return;
    setLoading(true);
    setPage(1);
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function goToPage(next: number) {
    if (loading || next < 1 || next > totalPages || next === page) return;
    setLoading(true);
    setPage(next);
  }

  const enrichedFeedback = feedback.map((item) => {
    const matchedIC = ics.find((ic) => ic.IC_id === item.ic_id);
    const matchedProject = projects.find((p) => p.id === item.project_id);

    return {
      ...item,
      ic_name: matchedIC?.name ?? item.ic_name ?? null,
      project_name: matchedProject?.name ?? item.project_name ?? null,
    };
  });

  const searchSuggestions = ics.map<SearchSuggestion>((ic) => ({
    id: String(ic.IC_id),
    label: ic.name,
    value: ic.name,
  }));

  const projectOptions = projects
    .filter((project) =>
      enrichedFeedback.some((item) => item.project_id === project.id)
    )
    .map((project) => ({
      id: project.id,
      name: project.name,
    }));

  function openICTimeline(item: Feedback) {
    const ic = ics.find((entry) => entry.IC_id === item.ic_id);

    if (!ic) {
      alert('Could not find the IC associated with this feedback.');
      return;
    }

    setSelectedIC(ic);
  }

  if (selectedIC) {
    return <ICView ic={selectedIC} onBack={() => setSelectedIC(null)} />;
  }

   const pagination = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '0 0 20px 0' }}>
      <button
        type="button"
        className="btn btn-icon btn-secondary"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)', right:'4px' }}
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
        style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)', left:'4px' }}
      >
        {arrowForward}
      </button>
    </div>
  );

  return (
    <>
      <div style={{ padding: '0 20px' }}>
        <div className="box" style={{ margin: '20px 0', maxWidth: '100%' }}>
          <div className="filters-grid">
            <div className="filter-item">
              <span className="filter-label">IC</span>
              <AutocompleteSearch
                id="feedback-ic-search"
                className="search-wrapper"
                inputClassName="input-control"
                label="Search ICs"
                placeholder="Search ICs..."
                value={searchInputs.icName}
                suggestions={searchSuggestions}
                onChange={(value) =>
                  setSearchInputs((current) => ({ ...current, icName: value }))
                }
              />
            </div>

            <div className="filter-item">
              <span className="filter-label">Project</span>
              <select name="projectId" className="input-control" value={filters.projectId} onChange={handleChange}>
                <option value="">All</option>
                {projectOptions.map((project) => (
                  <option key={project.id} value={String(project.id)}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">Score</span>
              <select name="score" className="input-control" value={filters.score} onChange={handleChange}>
                <option value="">All</option>
                {SCORES.map((score) => (
                  <option key={score} value={String(score)}>
                    {score}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <span className="filter-label">Sort by date</span>
              <select name="sortBy" className="input-control" value={filters.sortBy} onChange={handleChange}>
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          <div className="filter-item">
            <span className="filter-label">Search</span>
            <div className="search-wrapper">
              {searchIcon}
              <input
                type="text"
                name="text"
                placeholder="Search feedback text..."
                className="input-control"
                value={searchInputs.text}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="view-toggle-container">
          <button
            type="button"
            onClick={() => changeViewMode('table')}
            className={`btn-toggle-view ${viewMode === 'table' ? 'active' : ''}`}
          >
            {tableChartIcon}
          </button>
          <button
            type="button"
            onClick={() => changeViewMode('list')}
            className={`btn-toggle-view ${viewMode === 'list' ? 'active' : ''}`}
          >
            {viewListIcon}
          </button>
        </div>

        {loading && <p>Loading data...</p>}
        {!loading && loadError && <p role="alert">{loadError}</p>}
        {!loading && !loadError && enrichedFeedback.length === 0 && <p>No feedback entries match the applied filters.</p>}

        {!loading && enrichedFeedback.length > 0 && (
          <div ref={feedbackContainerRef}>
            {viewMode === 'table' && (
              <div className="box" style={{ margin: '0 0 20px 0', padding: '0', maxWidth: '100%', overflowX: 'auto' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject</th>
                      <th>Project</th>
                      <th>Source</th>
                      <th>Score</th>
                      <th>Excerpt</th>
                      <th>Attachment</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedFeedback.map((item) => (
                      <tr key={item.id}>
                        <td className="text-caption-default" style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontWeight: 600 }}>{item.ic_name ?? '-'}</span>
                            {item.source_name.toLowerCase().includes('peer') && <span className="badge-shared" style={{ width: 'fit-content' }}>Shared</span>}
                          </div>
                        </td>
                        <td>{item.project_name ?? '-'}</td>
                        <td style={{ color: 'var(--text-muted)' }}>{item.source_name}</td>
                        <td>
                          <span className="score-badge" data-score={item.score}>{item.score}</span>
                        </td>
                        <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.comment ?? '-'}
                        </td>
                        <td>
                          {item.screenshot_url ? (
                            <ScreenshotThumb url={item.screenshot_url} size="sm" />
                          ) : '-'}
                        </td>
                        <td>
                          <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }} onClick={() => openICTimeline(item)}>View in Timeline</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'list' && (
              <div className="box-columns" style={{ gap: '16px', marginBottom: '20px' }}>
                {enrichedFeedback.map((item) => (
                  <div key={item.id} className="feedback-card">
                    <div className="feedback-card-header">
                      <span className="score-badge" data-score={item.score} style={{ width: '32px', height: '32px', fontSize: '14px'}}>
                        {item.score}
                      </span>

                      <div className="feedback-card-meta">
                        <div className="feedback-card-name-row">
                          <h4 className="feedback-card-name">{item.ic_name ?? '-'}</h4>
                          {(item.source_name.toLowerCase().includes('peer') || item.id === 3) && (
                            <span className="badge-shared">Shared</span>
                          )}
                        </div>
                        <span className="feedback-card-subtext">
                          {item.date} · {item.project_name ?? '-'}
                        </span>
                      </div>
                      {item.screenshot_url && (
                        <div style={{ marginLeft: 'auto' }}>
                          <ScreenshotThumb url={item.screenshot_url} size="sm" />
                        </div>
                      )}
                    </div>

                    <p className="feedback-card-body">
                      {item.comment ?? '-'}
                    </p>

                    <div className="feedback-card-footer">
                      <span className="text-label-meta" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                        {item.source_name}
                      </span>
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }} onClick={() => openICTimeline(item)}>
                        View in Timeline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!loading && totalItems > 0 && pagination}
      </div>
    </>
  );
}
export default FeedbackLogComp;