import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';
import ICView from './IcView';

const SCORES = [1, 2, 3, 4, 5];

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIC, setSelectedIC] = useState<{
    IC_id: number;
    name: string;
    title: string;
    entries: number;
  } | null>(null);

  const [filters, setFilters] = useState<FeedbackFilters>({
    icName: '',
    projectId: '',
    score: '',
    sortBy: 'newest',
    text: '',
  });

  useEffect(() => {
    obtainFeedback()
      .then((data) => setFeedback(data))
      .catch((error) => console.error('Error loading feedback:', error))
      .finally(() => setLoading(false));
  }, []);

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  const icNames = Array.from(
    new Set(
      feedback
        .map((item) => item.ic_name ?? '')
        .filter((name) => name !== '')
    )
  );

  const projectOptions: { id: number; name: string }[] = [];

  feedback.forEach((item) => {
    if (item.project_id !== null && item.project_name) {
      const exists = projectOptions.some(
        (project) => project.id === item.project_id
      );

      if (!exists) {
        projectOptions.push({
          id: item.project_id,
          name: item.project_name,
        });
      }
    }
  });

  const filteredFeedback = feedback
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

  if (selectedIC) {
    return (
      <ICView
        ic={selectedIC}
        onBack={() => setSelectedIC(null)}
      />
    );
  }

  async function openICTimeline(item: Feedback) {
    if (item.ic_id === null || !item.ic_name) {
      alert('This feedback does not have an associated IC.');
      return;
    }

    try {
      const response = await fetch(
        'https://feedback-api-latest-moe8.onrender.com/ics'
      );

      if (!response.ok) {
        throw new Error('Could not load ICs');
      }

      const result = await response.json();
      const ics = Array.isArray(result?.data) ? result.data : [];

      const ic = ics.find(
        (entry: { IC_id: number }) => entry.IC_id === item.ic_id
      );

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
    } catch (error) {
      console.error('Error opening IC timeline:', error);
      alert('Could not load the IC details. Please try again.');
    }
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
      </div>

      <div className="box">
        {loading && <p>Loading data...</p>}

        {!loading && filteredFeedback.length === 0 && (
          <p>No feedback entries match the applied filters.</p>
        )}

        {!loading && filteredFeedback.length > 0 && (
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
                  <td>{item.score}</td>

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
                      onClick={() => openICTimeline(item)}
                      disabled={item.ic_id === null}
                    >
                      View in Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

export default FeedbackLogComp;