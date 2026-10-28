
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Feedback } from '../types/feedback';
import { obtainFeedback } from '../service/ObtainFeedback';

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

type FeedbackForm = {
  author_id: string;
  project_id: string;
  date: string;
  source_name: string;
  score: string;
  comment: string;
  screenshot_url: string;
};

const API_URL = 'https://feedback-api-latest-moe8.onrender.com/feedback';

const emptyForm: FeedbackForm = {
  author_id: '',
  project_id: '',
  date: new Date().toISOString().slice(0, 10),
  source_name: '',
  score: '3',
  comment: '',
  screenshot_url: '',
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '6px',
  fontSize: '14px',
};

const buttonStyle = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600,
};

function ICView({ ic, onBack }: ICViewProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FeedbackForm>({ ...emptyForm });
  const [showForm, setShowForm] = useState(false);

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

  const sortedFeedbacks = useMemo(
    () =>
      [...feedbacks].sort((a, b) =>
        (b.date ?? '').localeCompare(a.date ?? '')
      ),
    [feedbacks]
  );

  const averageScore = useMemo(() => {
    if (feedbacks.length === 0) return 0;

    return (
      feedbacks.reduce((total, item) => total + Number(item.score), 0) /
      feedbacks.length
    );
  }, [feedbacks]);

  const scoreCounts = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((score) => ({
        score,
        count: feedbacks.filter((item) => Number(item.score) === score).length,
      })),
    [feedbacks]
  );

  const maxCount = Math.max(1, ...scoreCounts.map((item) => item.count));

  function handleFormChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function startEdit(item: Feedback) {
    setEditingId(item.id);
    setForm({
      author_id: String(item.author_id),
      project_id: item.project_id === null ? '' : String(item.project_id),
      date: item.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
      source_name: item.source_name ?? '',
      score: String(item.score),
      comment: item.comment ?? '',
      screenshot_url: item.screenshot_url ?? '',
    });
    setShowForm(true);
    setError('');
    setSuccess('');
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const authorId = Number(form.author_id);
    const projectId = form.project_id === '' ? null : Number(form.project_id);
    const score = Number(form.score);

    if (!Number.isInteger(authorId) || authorId <= 0) {
      setError('Enter a valid positive author ID.');
      return;
    }

    if (
      projectId !== null &&
      (!Number.isInteger(projectId) || projectId <= 0)
    ) {
      setError('Project ID must be a positive integer.');
      return;
    }

    if (!form.source_name.trim()) {
      setError('Source is required.');
      return;
    }

    if (!Number.isInteger(score) || score < 1 || score > 5) {
      setError('Score must be between 1 and 5.');
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
      const response = await fetch(
        editingId === null ? API_URL : `${API_URL}/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Request failed with status ${response.status}`
        );
      }

      cancelForm();
      setSuccess(
        editingId === null
          ? 'Feedback created successfully.'
          : 'Feedback updated successfully.'
      );

      await loadFeedbacks();
    } catch (err) {
      console.error('Error saving feedback:', err);
      setError(
        err instanceof Error
          ? `Could not save feedback: ${err.message}`
          : 'Could not save feedback.'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this feedback? This action cannot be undone.'
    );

    if (!confirmed) return;

    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(
          responseText || `Request failed with status ${response.status}`
        );
      }

      setFeedbacks((current) => current.filter((item) => item.id !== id));
      setSuccess('Feedback deleted successfully.');

      if (editingId === id) cancelForm();
    } catch (err) {
      console.error('Error deleting feedback:', err);
      setError(
        err instanceof Error
          ? `Could not delete feedback: ${err.message}`
          : 'Could not delete feedback.'
      );
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#222' }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          ...buttonStyle,
          background: '#eee',
          color: '#222',
          marginBottom: '20px',
        }}
      >
        ← Back to Feedback Log
      </button>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 6px' }}>{ic.name}</h2>
          <p style={{ margin: 0, color: '#666' }}>{ic.title}</p>
          <small>IC ID: {ic.IC_id}</small>
        </div>

        <button
          type="button"
          onClick={startCreate}
          style={{
            ...buttonStyle,
            background: '#243b80',
            color: 'white',
          }}
        >
          + Add feedback
        </button>
      </div>

      {error && (
        <p role="alert" style={{ color: '#b42318', marginBottom: '12px' }}>
          {error}
        </p>
      )}

      {success && (
        <p role="status" style={{ color: '#18733b', marginBottom: '12px' }}>
          {success}
        </p>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={statCardStyle}>
          <p style={statLabelStyle}>Average score</p>
          <strong style={statValueStyle}>
            {feedbacks.length ? averageScore.toFixed(2) : '—'} / 5
          </strong>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>Total feedbacks</p>
          <strong style={statValueStyle}>{feedbacks.length}</strong>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>Latest feedback</p>
          <strong style={{ fontSize: '17px' }}>
            {sortedFeedbacks[0]?.date?.slice(0, 10) ?? '—'}
          </strong>
        </div>
      </div>

      <section
        style={{
          border: '1px solid #e1e1e1',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Feedback score distribution</h3>
        <p style={{ color: '#666', fontSize: '14px' }}>
          Number of feedbacks for each score, from 1 to 5.
        </p>

        {feedbacks.length === 0 ? (
          <p>No scores available to display yet.</p>
        ) : (
          <svg
            viewBox="0 0 360 190"
            role="img"
            aria-label="Bar chart showing the number of feedbacks for scores one through five"
            style={{ width: '100%', maxWidth: '500px', display: 'block' }}
          >
            {[0, 1, 2, 3].map((step) => {
              const y = 145 - step * 40;

              return (
                <g key={step}>
                  <line
                    x1="35"
                    y1={y}
                    x2="345"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                  />
                  <text
                    x="25"
                    y={y + 4}
                    fontSize="10"
                    textAnchor="end"
                    fill="#666"
                  >
                    {Math.round((maxCount * step) / 3)}
                  </text>
                </g>
              );
            })}

            {scoreCounts.map(({ score, count }, index) => {
              const barHeight = (count / maxCount) * 120;
              const x = 48 + index * 60;
              const y = 145 - barHeight;

              return (
                <g key={score}>
                  <rect
                    x={x}
                    y={y}
                    width="34"
                    height={barHeight}
                    rx="4"
                    fill="#4059a8"
                  />
                  <text
                    x={x + 17}
                    y={Math.max(12, y - 6)}
                    fontSize="11"
                    textAnchor="middle"
                    fill="#222"
                  >
                    {count}
                  </text>
                  <text
                    x={x + 17}
                    y="165"
                    fontSize="12"
                    textAnchor="middle"
                    fill="#444"
                  >
                    {score}
                  </text>
                </g>
              );
            })}

            <text
              x="190"
              y="185"
              fontSize="11"
              textAnchor="middle"
              fill="#666"
            >
              Score
            </text>
          </svg>
        )}
      </section>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: '1px solid #ddd',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          <h3 style={{ gridColumn: '1 / -1', margin: 0 }}>
            {editingId === null ? 'Create feedback' : 'Edit feedback'}
          </h3>

          <label>
            Author ID *
            <input
              name="author_id"
              type="number"
              min="1"
              required
              value={form.author_id}
              onChange={handleFormChange}
              style={inputStyle}
            />
          </label>

          <label>
            Project ID
            <input
              name="project_id"
              type="number"
              min="1"
              value={form.project_id}
              onChange={handleFormChange}
              placeholder="Optional"
              style={inputStyle}
            />
          </label>

          <label>
            Date *
            <input
              name="date"
              type="date"
              required
              value={form.date}
              onChange={handleFormChange}
              style={inputStyle}
            />
          </label>

          <label>
            Source *
            <input
              name="source_name"
              type="text"
              required
              value={form.source_name}
              onChange={handleFormChange}
              placeholder="e.g. Code review"
              style={inputStyle}
            />
          </label>

          <label>
            Score *
            <select
              name="score"
              value={form.score}
              onChange={handleFormChange}
              required
              style={inputStyle}
            >
              {[1, 2, 3, 4, 5].map((score) => (
                <option key={score} value={score}>
                  {score}
                </option>
              ))}
            </select>
          </label>

          <label>
            Screenshot URL
            <input
              name="screenshot_url"
              type="url"
              value={form.screenshot_url}
              onChange={handleFormChange}
              placeholder="https://..."
              style={inputStyle}
            />
          </label>

          <label style={{ gridColumn: '1 / -1' }}>
            Comment
            <textarea
              name="comment"
              value={form.comment}
              onChange={handleFormChange}
              rows={3}
              placeholder="Write feedback..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </label>

          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                ...buttonStyle,
                background: '#243b80',
                color: 'white',
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving
                ? 'Saving...'
                : editingId === null
                  ? 'Create feedback'
                  : 'Save changes'}
            </button>

            <button
              type="button"
              onClick={cancelForm}
              disabled={saving}
              style={{
                ...buttonStyle,
                background: '#eee',
                color: '#222',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h3>Feedback history</h3>

      {loading && <p>Loading feedback...</p>}

      {!loading && sortedFeedbacks.length === 0 && (
        <p>No feedback entries found for this IC.</p>
      )}

      <div style={{ display: 'grid', gap: '14px' }}>
        {!loading &&
          sortedFeedbacks.map((item) => (
            <article
              key={item.id}
              style={{
                border: '1px solid #e1e1e1',
                borderRadius: '10px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <strong>{item.source_name}</strong>
                  <p style={{ color: '#666', margin: '5px 0' }}>
                    {item.date?.slice(0, 10) ?? 'No date'}
                    {' · '}
                    {item.project_name ?? (
                      item.project_id ? `Project #${item.project_id}` : 'No project'
                    )}
                  </p>
                </div>

                <strong style={{ fontSize: '18px' }}>
                  {item.score} / 5
                </strong>
              </div>

              <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                {item.comment || 'No comment provided.'}
              </p>

              {item.screenshot_url && (
                <p>
                  <a
                    href={item.screenshot_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View screenshot
                  </a>
                </p>
              )}

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  style={{
                    ...buttonStyle,
                    background: '#e8edff',
                    color: '#243b80',
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  style={{
                    ...buttonStyle,
                    background: '#fde8e7',
                    color: '#a3211b',
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
      </div>
    </div>
  );
}

const statCardStyle = {
  border: '1px solid #e1e1e1',
  borderRadius: '10px',
  padding: '18px',
};

const statLabelStyle = {
  color: '#666',
  margin: '0 0 8px',
  fontSize: '14px',
};

const statValueStyle = {
  fontSize: '26px',
};

export default ICView;
