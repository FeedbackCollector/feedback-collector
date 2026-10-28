import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';

const SCORES = [1,2,3,4,5];

const searchIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
const tableChartIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z"/></svg>
const viewListIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg>

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');
  const [filters, setFilters] = useState<FeedbackFilters>({
    icName: '',
    projectId: '',
    score: '',
    sortBy: 'newest',
    text: '',
  });

  useEffect(() => {
    obtainFeedback().then((data) => {
      setFeedback(data);
      setLoading(false);
    });
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  const icNames = Array.from(
    new Set(feedback.map((item) => item.ic_name ?? '').filter((name) => name !== ''))
  );

  const projectOptions: { id: number; name: string }[] = [];
  feedback.forEach((item) => {
    if (item.project_id !== null && item.project_name !== null) {
      const exists = projectOptions.some((p) => p.id === item.project_id);
      if (!exists) projectOptions.push({ id: item.project_id, name: item.project_name });
    }
  });

  const filteredFeedback = feedback
    .filter((item) => {
      if (filters.icName === '') return true;
      const name = item.ic_name ?? '';
      return name.toLowerCase().includes(filters.icName.toLowerCase());
    })
    .filter((item) => filters.projectId === '' || String(item.project_id) === filters.projectId)
    .filter((item) => filters.score === '' || item.score === Number(filters.score))
    .filter((item) => {
      if (filters.text === '') return true;
      const commentText = item.comment ?? ''; 
      return commentText.toLowerCase().includes(filters.text.toLowerCase());
    })
    .sort((a, b) => {
      const dateA = a.date ?? '';
      const dateB = b.date ?? '';
      if (filters.sortBy === 'oldest') return dateA.localeCompare(dateB);
      return dateB.localeCompare(dateA);
    });

  return (
    <>
      <div style={{ padding: '0 20px' }}>
        <div className="box" style={{ margin: '20px 0', maxWidth: '100%' }}>
          <div className="filters-grid">
            <div className="filter-item">
              <span className="filter-label">IC</span>
              <div className="search-wrapper">
                {searchIcon}
                <input
                  type="text"
                  name="icName"
                  placeholder='Search ICs...'
                  className="input-control"
                  list="ics-list"
                  value={filters.icName}
                  onChange={handleChange}
                />
              </div>
              <datalist id="ics-list">
                {icNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
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
                value={filters.text}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="view-toggle-container">
          <button 
            type="button"
            onClick={() => setViewMode('table')}
            className={`btn-toggle-view ${viewMode === 'table' ? 'active' : ''}`}
            style={{ color: viewMode === 'table' ? 'var(--surface)' : 'var(--text-muted)' }}
          >
            {tableChartIcon}
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            className={`btn-toggle-view ${viewMode === 'list' ? 'active' : ''}`}
            style={{ color: viewMode === 'list' ? 'var(--surface)' : 'var(--text-muted)' }}
          >
            {viewListIcon}
          </button>
        </div>

        {loading && <p>Loading data...</p>}
        {!loading && filteredFeedback.length === 0 && <p>No feedback entries match the applied filters.</p>}

        {!loading && filteredFeedback.length > 0 && viewMode === 'table' && (
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
                {filteredFeedback.map((item) => (
                  <tr key={item.id}>
                    <td className="text-caption-default" style={{ color: 'var(--text-muted)' }}>{item.date}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{item.ic_name ?? '—'}</span>
                        {item.source_name.toLowerCase().includes('peer') && <span className="badge-shared" style={{ width: 'fit-content' }}>Shared</span>}
                      </div>
                    </td>
                    <td>{item.project_name ?? '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{item.source_name}</td>
                    <td>
                      <span className="score-badge" data-score={item.score}>{item.score}</span>
                    </td>
                    <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.comment ?? '—'}
                    </td>
                    <td>
                      {item.screenshot_url ? (
                        <a href={item.screenshot_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>View</a>
                      ) : '—'}
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px' }}>View in Timeline</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredFeedback.length > 0 && viewMode === 'list' && (
          <div className="box-columns" style={{ gap: '16px', marginBottom: '20px' }}>
            {filteredFeedback.map((item) => (
              <div key={item.id} className="feedback-card animate-slide-up">
                <div className="feedback-card-header">
                  <span className="score-badge" data-score={item.score} style={{ width: '32px', height: '32px', fontSize: '14px'}}>
                    {item.score}
                  </span>
                  
                  <div className="feedback-card-meta">
                    <div className="feedback-card-name-row">
                      <h4 className="feedback-card-name">{item.ic_name ?? '—'}</h4>
                      {(item.source_name.toLowerCase().includes('peer') || item.id === 3) && (
                        <span className="badge-shared">Shared</span>
                      )}
                    </div>
                    <span className="feedback-card-subtext">
                      {item.date} • {item.project_name ?? '—'}
                    </span>
                  </div>
                </div>

                <p className="feedback-card-body">
                  {item.comment ?? '—'}
                </p>

                <div className="feedback-card-footer">
                  <span className="text-label-meta" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                    {item.source_name}
                  </span>
                  <button className="btn btn-secondary" style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '13px' }}>
                    View in Timeline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default FeedbackLogComp;
