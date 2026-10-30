import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters, IC, Project } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';
import ICView from './IcView';
import { obtainICs } from '../service/ObtainICs';
import { getProjects} from '../service/ObtainProjects';
import { formatDate } from '../utils/feedbackFormat';
import './FeedbackLog.css';

const SCORES = [1, 2, 3, 4, 5];

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [ics, setIcs] = useState<IC[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedIC, setSelectedIC] = useState<{
    IC_id: number;
    name: string;
    title: string;
    entries: number;
  } | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'list'>('table');

  const [filters, setFilters] = useState<FeedbackFilters>({
    icName: '',
    projectId: '',
    score: '',
    sortBy: 'newest',
    text: '',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [feedbackData, icsData, projectsData] = await Promise.all([
          obtainFeedback(),
          obtainICs(),
          getProjects(),
        ]);

        setFeedback(feedbackData);
        setIcs(icsData);
        setProjects(projectsData);
      } catch (error) {
        console.error('Error loading feedback log data:', error);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  const enrichedFeedback = feedback.map((item) => {
    const matchedIC =
      item.ic_id === null
        ? undefined
        : ics.find((ic) => ic.IC_id === item.ic_id);

    const matchedProject =
      item.project_id === null
        ? undefined
        : projects.find((project) => project.id === item.project_id);

    return {
      ...item,
      ic_name: matchedIC?.name ?? item.ic_name ?? null,
      project_name: matchedProject?.name ?? item.project_name ?? null,
    };
  });

  const icNames = Array.from(
    new Set(
      enrichedFeedback
        .map((item) => item.ic_name ?? '')
        .filter((name) => name !== '')
    )
  );

  const projectOptions = projects
    .filter((project) =>
      enrichedFeedback.some((item) => item.project_id === project.id)
    )
    .map((project) => ({
      id: project.id,
      name: project.name,
    }));

  const filteredFeedback = enrichedFeedback
    .filter((item) => {
      if (!filters.icName) return true;

      return (item.ic_name ?? '')
        .toLowerCase()
        .includes(filters.icName.toLowerCase());
    })
    .filter((item) => {
      if (!filters.projectId) return true;

      return String(item.project_id) === filters.projectId;
    })
    .filter((item) => {
      if (!filters.score) return true;

      return item.score === Number(filters.score);
    })
    .filter((item) => {
      if (!filters.text) return true;

      return (item.comment ?? '')
        .toLowerCase()
        .includes(filters.text.toLowerCase());
    })
    .sort((a, b) => {
      if (filters.sortBy === 'oldest') {
        return (a.date ?? '').localeCompare(b.date ?? '');
      }

      return (b.date ?? '').localeCompare(a.date ?? '');
    });

  function openICTimeline(item: Feedback) {
    if (item.ic_id === null) {
      alert(
        'This feedback does not have an associated IC. ' +
          'Please check the feedback data in the backend.'
      );
      return;
    }

    const ic = ics.find((entry) => entry.IC_id === item.ic_id);

    if (!ic) {
      alert('Could not find the IC associated with this feedback.');
      return;
    }

    setSelectedIC({
      IC_id: ic.IC_id,
      name: ic.name,
      title: ic.title,
      entries: ic.entries,
    });
  }

  if (selectedIC) {
    return (
      <ICView
        ic={selectedIC}
        onBack={() => setSelectedIC(null)}
      />
    );
  }

  const timelineButtonTitle = (item: Feedback) =>
    item.ic_id === null
      ? 'This feedback has no associated IC'
      : 'View IC timeline';

  return (
    <div className="fl-page">
      <section className="fl-card">
        <div className="fl-filters-grid">
          <label className="fl-field">
            <span className="fl-label">IC</span>
            <div className="fl-search-wrap">
              <i className="fa-solid fa-magnifying-glass" />
              <input
                type="text"
                name="icName"
                placeholder="Search ICs..."
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
          </label>

          <label className="fl-field">
            <span className="fl-label">Project</span>
            <select
              name="projectId"
              className="input-control"
              value={filters.projectId}
              onChange={handleChange}
            >
              <option value="">All</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={String(project.id)}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="fl-field">
            <span className="fl-label">Score</span>
            <select
              name="score"
              className="input-control"
              value={filters.score}
              onChange={handleChange}
            >
              <option value="">All</option>
              {SCORES.map((score) => (
                <option key={score} value={String(score)}>
                  {score}
                </option>
              ))}
            </select>
          </label>

          <label className="fl-field">
            <span className="fl-label">Sort by date</span>
            <select
              name="sortBy"
              className="input-control"
              value={filters.sortBy}
              onChange={handleChange}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <label className="fl-field fl-search-full">
          <span className="fl-label">Search</span>
          <div className="fl-search-wrap">
            <i className="fa-solid fa-magnifying-glass" />
            <input
              type="text"
              name="text"
              placeholder="Search feedback text..."
              className="input-control"
              value={filters.text}
              onChange={handleChange}
            />
          </div>
        </label>

      </section>
        <div className="fl-toolbar">
          <div className="fl-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={viewMode === 'table' ? 'is-active' : ''}
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
            >
              <i className="fa-solid fa-table-cells" />
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? 'is-active' : ''}
              onClick={() => setViewMode('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <i className="fa-solid fa-table-list" />
            </button>
          </div>
        </div>

      {loading && <p className="fl-empty">Loading data...</p>}

      {!loading && filteredFeedback.length === 0 && (
        <p className="fl-empty">No feedback entries match the applied filters.</p>
      )}

      {!loading && filteredFeedback.length > 0 && viewMode === 'table' && (
        <div className="fl-table-wrap animate-slide-up">
          <table className="fl-table">
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
                  <td>{formatDate(item.date)}</td>

                  <td>
                    <div className="fl-subject">
                      <span>{item.ic_name ?? '—'}</span>
                      {item.source_name.toLowerCase().includes('peer') && (
                        <span className="badge-shared">Shared</span>
                      )}
                    </div>
                  </td>

                  <td>{item.project_name ?? '—'}</td>
                  <td>{item.source_name}</td>

                  <td>
                    <span className="score-badge" data-score={item.score}>
                      {item.score}
                    </span>
                  </td>

                  <td>
                    <div className="fl-excerpt">{item.comment ?? '—'}</div>
                  </td>

                  <td>
                    {item.screenshot_url ? (
                      <a href={item.screenshot_url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      <span className="fl-muted">—</span>
                    )}
                  </td>

                  <td>
                    <button
                      type="button"
                      className="fl-action-btn"
                      onClick={() => openICTimeline(item)}
                      disabled={item.ic_id === null}
                      title={timelineButtonTitle(item)}
                    >
                      View in Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filteredFeedback.length > 0 && viewMode === 'list' && (
        <div className="box-columns animate-slide-up" style={{ gap: '16px' }}>
          {filteredFeedback.map((item) => (
            <div key={item.id} className="feedback-card">
              <div className="feedback-card-header">
                <span className="score-badge" data-score={item.score}>
                  {item.score}
                </span>

                <div className="feedback-card-meta">
                  <div className="feedback-card-name-row">
                    <h4 className="feedback-card-name">{item.ic_name ?? '—'}</h4>
                    {item.source_name.toLowerCase().includes('peer') && (
                      <span className="badge-shared">Shared</span>
                    )}
                  </div>
                  <span className="feedback-card-subtext">
                    {formatDate(item.date)} · {item.project_name ?? '—'}
                  </span>
                </div>
              </div>

              <p className="feedback-card-body">{item.comment ?? '—'}</p>

              <div className="feedback-card-footer">
                <span className="fl-muted" style={{ fontSize: '12px' }}>
                  {item.source_name}
                </span>

                {item.screenshot_url && (
                  <a href={item.screenshot_url} target="_blank" rel="noreferrer">
                    Screenshot
                  </a>
                )}

                <button
                  type="button"
                  className="fl-action-btn"
                  onClick={() => openICTimeline(item)}
                  disabled={item.ic_id === null}
                  title={timelineButtonTitle(item)}
                >
                  View in Timeline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FeedbackLogComp;
