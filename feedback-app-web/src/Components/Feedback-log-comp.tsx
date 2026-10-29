import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters, IC, Project } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';
import ICView from './IcView';
import { obtainICs } from '../service/ObtainICs';
import { obtainProjects } from '../service/ObtainProjects';

const SCORES = [1, 2, 3, 4, 5];

const searchIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z"/></svg>
const tableChartIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z"/></svg>
const viewListIcon = <svg xmlns="http://w3.org" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z"/></svg>


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
          obtainProjects(),
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

  return (
    <>
      <div className="box box-columns">
        <h3>Feedback Log</h3>

        <div className="box-grid">
          <div className="box-columns">
            IC
            <input
              type="text"
              name="icName"
              placeholder="Search ICs..."
              className="input-control"
              list="ics-list"
              value={filters.icName}
              onChange={handleChange}
            />

            <datalist id="ics-list">
              {icNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>

          <div className="box-columns">
            PROJECT
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
          </div>

          <div className="box-columns">
            SCORE
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
          </div>

          <div className="box-columns">
            SORT BY DATE
            <select
              name="sortBy"
              className="input-control"
              value={filters.sortBy}
              onChange={handleChange}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="box-columns">
          SEARCH
          <input
            type="text"
            name="text"
            placeholder="Search feedback text..."
            className="input-control"
            value={filters.text}
            onChange={handleChange}
          />
        </div>

        <div className="view-toggle-container">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`btn-toggle-view ${
              viewMode === 'table' ? 'active' : ''
            }`}
            aria-label="Table view"
            aria-pressed={viewMode === 'table'}
            style={{
              color:
                viewMode === 'table'
                  ? 'var(--surface)'
                  : 'var(--text-muted)',
            }}
          >
            {tableChartIcon}
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`btn-toggle-view ${
              viewMode === 'list' ? 'active' : ''
            }`}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
            style={{
              color:
                viewMode === 'list'
                  ? 'var(--surface)'
                  : 'var(--text-muted)',
            }}
          >
            {viewListIcon}
          </button>
        </div>
      </div>

      <div className="box">
        {loading && <p>Loading data...</p>}

        {!loading && filteredFeedback.length === 0 && (
          <p>No feedback entries match the applied filters.</p>
        )}

        {!loading &&
          filteredFeedback.length > 0 &&
          viewMode === 'table' && (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>IC</th>
                  <th>Project</th>
                  <th>Source</th>
                  <th>Text</th>
                  <th>Score</th>
                  <th>Screenshot</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredFeedback.map((item) => (
                  <tr key={item.id}>
                    <td>{item.date}</td>
                    <td>{item.ic_name ?? '—'}</td>
                    <td>{item.project_name ?? '—'}</td>
                    <td>{item.source_name}</td>
                    <td>{item.comment ?? '—'}</td>
                    <td>
                      <span
                        className="score-badge"
                        data-score={item.score}
                      >
                        {item.score}
                      </span>
                    </td>

                    <td>
                      {item.screenshot_url ? (
                        <a
                          href={item.screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          borderRadius: '6px',
                        }}
                        onClick={() => openICTimeline(item)}
                        disabled={item.ic_id === null}
                        title={
                          item.ic_id === null
                            ? 'This feedback has no associated IC'
                            : 'View IC timeline'
                        }
                      >
                        View in Timeline
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        {!loading &&
          filteredFeedback.length > 0 &&
          viewMode === 'list' && (
            <div
              className="box-columns"
              style={{ gap: '16px', marginBottom: '20px' }}
            >
              {filteredFeedback.map((item) => (
                <div
                  key={item.id}
                  className="feedback-card animate-slide-up"
                >
                  <div className="feedback-card-header">
                    <span
                      className="score-badge"
                      data-score={item.score}
                      style={{
                        width: '32px',
                        height: '32px',
                        fontSize: '14px',
                      }}
                    >
                      {item.score}
                    </span>

                    <div className="feedback-card-meta">
                      <div className="feedback-card-name-row">
                        <h4 className="feedback-card-name">
                          {item.ic_name ?? '—'}
                        </h4>

                        {item.source_name.toLowerCase().includes('peer') && (
                          <span className="badge-shared">Shared</span>
                        )}
                      </div>

                      <span className="feedback-card-subtext">
                        {item.date} · {item.project_name ?? '—'}
                      </span>
                    </div>
                  </div>

                  <p className="feedback-card-body">
                    {item.comment ?? '—'}
                  </p>

                  <div className="feedback-card-footer">
                    <span
                      className="text-label-meta"
                      style={{
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                      }}
                    >
                      {item.source_name}
                    </span>

                    {item.screenshot_url && (
                      <a
                        href={item.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--primary)' }}
                      >
                        Screenshot
                      </a>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        fontSize: '13px',
                      }}
                      onClick={() => openICTimeline(item)}
                      disabled={item.ic_id === null}
                      title={
                        item.ic_id === null
                          ? 'This feedback has no associated IC'
                          : 'View IC timeline'
                      }
                    >
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
