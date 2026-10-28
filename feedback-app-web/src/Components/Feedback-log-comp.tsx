import { useEffect, useState, type ChangeEvent } from 'react';
import type { Feedback, FeedbackFilters, IC, Project } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';
import { obtainICs } from '../service/ObtainICs';
import { obtainProjects } from '../service/ObtainProjects';

const SCORES = [1,2,3,4,5];

function FeedbackLogComp() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [ics, setIcs] = useState<IC[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
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
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  }

  const enrichedFeedback = feedback.map((item) => {
    const matchedIC = ics.find((ic) => ic.IC_id === item.author_id);
    const matchedProject = projects.find((p) => p.id === item.project_id);

    return {
      ...item,
      ic_name: item.ic_name || (matchedIC ? matchedIC.name : '—'),
      project_name: item.project_name || (matchedProject ? matchedProject.name : '—'),
    };
  });

  const icNames = Array.from(
    new Set(enrichedFeedback.map((item) => item.ic_name ?? '').filter((name) => name !== ''))
  );

  const projectOptions: { id: number; name: string }[] = [];
  enrichedFeedback.forEach((item) => {
    if (item.project_id !== null && item.project_name !== null && item.project_name !== undefined) {
      const exists = projectOptions.some((p) => p.id === item.project_id);
      if (!exists) projectOptions.push({ id: item.project_id, name: item.project_name });
    }
  });

  const filteredFeedback = enrichedFeedback
    .filter((item) => {
      if (filters.icName === '') return true;
      const name = item.ic_name ?? '';
      return name.toLowerCase().includes(filters.icName.toLowerCase());
    })
    .filter((item) => {
      if (filters.projectId === '') return true;
      return String(item.project_id) === filters.projectId;
    })
    .filter((item) => {
      if (filters.score === '') return true;
      return item.score === Number(filters.score);
    })
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
                <option key={project.id} value={String(project.id)}>
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
                <option key={score} value={String(score)}>
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
                  <td>{item.ic_name ?? '—'}</td>
                  <td>{item.project_name ?? '—'}</td>
                  <td>{item.source_name}</td>
                  <td>{item.comment ?? '—'}</td>
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
