import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import type { Feedback, Project } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';

import { useAuthStore } from '../store/authStore';
import { formatDate, getInitials } from '../utils/feedbackFormat';
import { getProjects } from '../service/ObtainProjects';
import '../styles/IcView.css';

type ICInfo = {
  IC_id: number;
  name: string;
  title: string;
  entries: number;
};

type ICViewProps = {
  ic: ICInfo;
  onBack: () => void;
};

type EntryForm = {
  project_id: string;
  date: string;
  source_name: string;
  source_title: string;
  comment: string;
  score: string;
  screenshot_url: string;
};

const API_URL = 'https://localhost:3000/feedback';

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = (): EntryForm => ({
  project_id: '',
  date: today(),
  source_name: '',
  source_title: '',
  comment: '',
  score: '3',
  screenshot_url: '',
});

function Sparkline({ scores }: { scores: number[] }) {
  if (scores.length < 2) {
    return <svg className="icv-sparkline" aria-hidden="true" />;
  }

  const width = 120;
  const height = 40;
  const pad = 4;
  const step = width / (scores.length - 1);

  const points = scores.map((score, index) => {
    const x = index * step;
    const y = height - pad - ((score - 1) / 4) * (height - pad * 2);
    return { x, y };
  });

  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      className="icv-sparkline"
      viewBox={`0 0 ${width} ${height}`}
      aria-label="Score trend"
    >
      <polygon points={area} fill="var(--primary-light)" />
      <polyline
        points={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ICView({ ic, onBack }: ICViewProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Feedback | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [formError, setFormError] = useState('');

  async function loadFeedbacks() {
    setLoading(true);
    setError('');

    try {
      const data = await obtainFeedback();
      setFeedbacks(data.filter((item) => item.ic_id === ic.IC_id));
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Could not load feedbacks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedbacks();
  }, [ic.IC_id]);

  useEffect(() => {
    getProjects().then(setProjects);
  }, []);

  const newestFirst = useMemo(
    () => [...feedbacks].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [feedbacks]
  );

  const oldestFirstScores = useMemo(
    () =>
      [...feedbacks]
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
        .map((item) => Number(item.score)),
    [feedbacks]
  );

  const averageScore = useMemo(() => {
    if (feedbacks.length === 0) return null;
    const total = feedbacks.reduce((sum, item) => sum + Number(item.score), 0);
    return Math.round(total / feedbacks.length);
  }, [feedbacks]);

  function projectNameOf(item: Feedback): string {
    const match = projects.find((project) => project.id === item.project_id);
    return match?.name ?? item.project_name ?? '—';
  }

  function handleFieldChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreate() {
    setEditingItem(null);
    setForm(emptyForm());
    setFormError('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function openEdit(item: Feedback) {
    setEditingItem(item);
    setForm({
      project_id: item.project_id === null ? '' : String(item.project_id),
      date: item.date?.slice(0, 10) || today(),
      source_name: item.source_name ?? '',
      source_title: '',
      comment: item.comment ?? '',
      score: String(item.score),
      screenshot_url: item.screenshot_url ?? '',
    });
    setFormError('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingItem(null);
    setFormError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const authorId = editingItem ? editingItem.author_id : currentUserId;
    const projectId = Number(form.project_id);
    const score = Number(form.score);

    if (!authorId) {
      setFormError('Could not identify the logged-in user. Please log in again.');
      return;
    }
    if (form.project_id === '' || !Number.isInteger(projectId) || projectId <= 0) {
      setFormError('Select a project.');
      return;
    }
    if (!form.date) {
      setFormError('Date is required.');
      return;
    }
    if (!form.source_name.trim()) {
      setFormError('Source is required.');
      return;
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      setFormError('Score must be between 1 and 5.');
      return;
    }

    const payload = {
      author_id: authorId,
      ic_id: ic.IC_id,
      project_id: projectId,
      date: form.date,
      source_name: form.source_name.trim(),
      score,
      comment: form.comment.trim() || null,
      screenshot_url: form.screenshot_url.trim() || null,
    };

    setSaving(true);

    try {
      const isEditing = editingItem !== null;
      const response = await fetch(
        isEditing ? `${API_URL}/${editingItem.id}` : API_URL,
        {
          method: isEditing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `Request failed with status ${response.status}`);
      }

      closeModal();
      setSuccess(isEditing ? 'Entry updated successfully.' : 'Entry created successfully.');
      await loadFeedbacks();
    } catch (err) {
      console.error('Error saving feedback:', err);
      setFormError(
        err instanceof Error
          ? `Could not save entry: ${err.message}`
          : 'Could not save entry.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this entry? This action cannot be undone.'
    );
    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || `Request failed with status ${response.status}`);
      }

      setFeedbacks((current) => current.filter((item) => item.id !== id));
      setSuccess('Entry deleted successfully.');

      if (editingItem?.id === id) {
        closeModal();
      }
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError(
        err instanceof Error
          ? `Could not delete entry: ${err.message}`
          : 'Could not delete entry.'
      );
    }
  }

  return (
    <div className="icv-page">
      <header className="icv-topbar">
        <div className="icv-title-group">
          <button
            type="button"
            className="icv-back-btn"
            onClick={onBack}
            aria-label="Back to Feedback Log"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1 className="icv-title">{ic.name}</h1>
        </div>

        <button type="button" className="icv-primary-btn" onClick={openCreate}>
          <i className="fa-solid fa-plus" />
          New Entry
        </button>
      </header>

      {error && <div role="alert" className="icv-alert is-error">{error}</div>}
      {success && <div role="status" className="icv-alert is-success">{success}</div>}

      <section className="icv-summary">
        <div className="icv-person">
          <div className="icv-avatar">{getInitials(ic.name)}</div>
          <div>
            <div className="icv-person-name">{ic.name}</div>
            <div className="icv-person-role">{ic.title}</div>
          </div>
        </div>

        <div className="icv-stats">
          <div className="icv-stat">
            <span className="icv-stat-label">Average</span>
            {averageScore === null ? (
              <span className="icv-stat-value">—</span>
            ) : (
              <span
                className="score-badge icv-avg-badge"
                data-score={averageScore}
                title="Rounded average score"
              >
                {averageScore}
              </span>
            )}
          </div>

          <div className="icv-stat">
            <span className="icv-stat-label">Entries</span>
            <span className="icv-stat-value">{feedbacks.length}</span>
          </div>

          <Sparkline scores={oldestFirstScores} />
        </div>
      </section>

      <section className="icv-entries">
        {loading && <p className="icv-muted">Loading feedback...</p>}

        {!loading && newestFirst.length === 0 && (
          <p className="icv-muted">No entries have been registered for this IC yet.</p>
        )}

        {!loading &&
          newestFirst.map((item) => (
            <article key={item.id} className="icv-entry animate-slide-up">
              <div className="icv-entry-head animate-slide-up">
                <div className="icv-entry-meta">
                  <span className="score-badge" data-score={item.score}>
                    {item.score}
                  </span>
                  <span>
                    {formatDate(item.date)} · {projectNameOf(item)} · {item.source_name}
                  </span>
                </div>

                <div className="icv-entry-actions">
                  <button
                    type="button"
                    className="icv-icon-btn"
                    onClick={() => openEdit(item)}
                    aria-label="Edit entry"
                  >
                    <i className="fa-solid fa-pen" />
                  </button>
                  <button
                    type="button"
                    className="icv-icon-btn is-danger"
                    onClick={() => void handleDelete(item.id)}
                    aria-label="Delete entry"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>

              {item.comment && <p className="icv-entry-body">{item.comment}</p>}

              {item.screenshot_url && (
                <a href={item.screenshot_url} target="_blank" rel="noreferrer">
                  <img
                    className="icv-thumb"
                    src={item.screenshot_url}
                    alt="Screenshot attached to this entry"
                  />
                </a>
              )}
            </article>
          ))}
      </section>

      {modalOpen && (
        <div className="icv-overlay" onClick={closeModal}>
          <div
            className="icv-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="icv-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <form className="icv-form" onSubmit={handleSubmit}>
              <h2 id="icv-modal-title">
                {editingItem ? 'Edit Entry' : 'New Entry'}
              </h2>

              <label className="icv-field">
                <span className="icv-label">Date</span>
                <input
                  className="input-control"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleFieldChange}
                  required
                />
              </label>

              <label className="icv-field">
                <span className="icv-label">Project</span>
                <select
                  className="input-control"
                  name="project_id"
                  value={form.project_id}
                  onChange={handleFieldChange}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    
                    <option key={project.id} value={String(project.id)}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="icv-field">
                <span className="icv-label">Source (who this feedback is from)</span>
                <input
                  className="input-control"
                  name="source_name"
                  type="text"
                  value={form.source_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Stakeholder Review, Peer Feedback"
                  required
                />
              </label>

              <label className="icv-field">
                <span className="icv-label">Source title</span>
                <input
                  className="input-control"
                  name="source_title"
                  type="text"
                  value={form.source_title}
                  onChange={handleFieldChange}
                  placeholder="e.g. Product Manager, Client, Peer"
                />
                <span className="icv-hint">
                  Not saved yet: the API has no field for it.
                </span>
              </label>

              <label className="icv-field">
                <span className="icv-label">Comment</span>
                <textarea
                  name="comment"
                  value={form.comment}
                  onChange={handleFieldChange}
                  rows={4}
                />
              </label>

              <label className="icv-field">
                <span className="icv-label">Score</span>
                <select
                  className="input-control"
                  name="score"
                  value={form.score}
                  onChange={handleFieldChange}
                  required
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </label>

              <label className="icv-field">
                <span className="icv-label">Screenshot (optional)</span>
                <input
                  className="input-control"
                  name="screenshot_url"
                  type="url"
                  value={form.screenshot_url}
                  onChange={handleFieldChange}
                  placeholder="https://..."
                />
              </label>

              {formError && (
                <div role="alert" className="icv-alert is-error">
                  {formError}
                </div>
              )}

              <div className="icv-modal-actions">
                <button
                  type="button"
                  className="icv-ghost-btn"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="icv-primary-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ICView;
