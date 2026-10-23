import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedBack';

const SCORES = [1, 2, 3, 4, 5];

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
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

  const icNames = Array.from(new Set(feedback.map((item) => item.ic_name ?? '').filter((name) => name !== '')));

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
      return (item.ic_name ?? '').toLowerCase().includes(filters.icName.toLowerCase());
    })
    .filter((item) => filters.projectId === '' || String(item.project_id) === filters.projectId)
    .filter((item) => filters.score === '' || item.score === Number(filters.score))
    .filter((item) => {
      if (filters.text === '') return true;
      const search = filters.text.toLowerCase();
      return item.text.toLowerCase().includes(search) || item.comment.toLowerCase().includes(search);
    })
    .sort((a, b) => {
      if (filters.sortBy === 'oldest') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });

  return (
    <>
      <div className="box box-columns">
        <h3>FeedBack Log</h3>

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
            <select name="projectId" className="input-control" value={filters.projectId} onChange={handleChange}>
              <option value="">All</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="box-columns">
            SCORE
            <select name="score" className="input-control" value={filters.score} onChange={handleChange}>
              <option value="">All</option>
              {SCORES.map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </div>

          <div className="box-columns">
            SORT BY DATE
            <select name="sortBy" className="input-control" value={filters.sortBy} onChange={handleChange}>
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

        {!loading && filteredFeedback.length === 0 && <p>No feedback entries match the applied filters.</p>}

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
              </tr>
            </thead>
            <tbody>
              {filteredFeedback.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td>{item.ic_name}</td>
                  <td>{item.project_name}</td>
                  <td>{item.source_name}</td>
                  <td>{item.text}</td>
                  <td>{item.score}</td>
                  <td>
                    {item.screenshot_url ? (
                      <a href={item.screenshot_url} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      '—'
                    )}
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