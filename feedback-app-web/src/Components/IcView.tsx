
import { useEffect, useMemo, useState, type FormEvent, type ChangeEvent } from 'react';
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

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: FeedbackForm = {
  author_id: '',
  project_id: '',
  date: today(),
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
  marginTop: '6px',
};

const buttonStyle = {
  padding: '9px 14px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: 600 as const,
};

const statCardStyle = {
  background: '#f7f8fa',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '18px',
  flex: '1',
  minWidth: '140px',
};

const statLabelStyle = {
  margin: 0,
  fontSize: '13px',
  color: '#666',
};

const statValueStyle = {
  margin: '8px 0 0',
  fontSize: '26px',
  fontWeight: 700,
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
        count: feedbacks.filter(
          (item) => Number(item.score) === score
        ).length,
      })),
    [feedbacks]
  );

  const maxCount = Math.max(1, ...scoreCounts.map((item) => item.count));

  function handleFormChange(
    event: ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
      project_id:
        item.project_id === null ? '' : String(item.project_id),
      date: item.date?.slice(0, 10) || today(),
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
    const projectId = Number(form.project_id);
    const score = Number(form.score);

    if (!Number.isInteger(authorId) || authorId <= 0) {
      setError('Enter a valid positive author ID.');
      return;
    }

    // project_id is required by the API.
    if (form.project_id.trim() === '') {
      setError('You must enter a project ID.');
      return;
    }

    if (!Number.isInteger(projectId) || projectId <= 0) {
      setError('Project ID must be a positive integer.');
      return;
    }

    if (!form.date) {
      setError('Date is required.');
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
        editingId === null
          ? API_URL
          : `${API_URL}/${editingId}`,
        {
          method: editingId === null ? 'POST' : 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const responseText = await response.text();

        throw new Error(
          responseText ||
            `Request failed with status ${response.status}`
        );
      }

      const wasEditing = editingId !== null;

      cancelForm();

      setSuccess(
        wasEditing
          ? 'Feedback updated successfully.'
          : 'Feedback created successfully.'
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
          responseText ||
            `Request failed with status ${response.status}`
        );
      }

      setFeedbacks((current) =>
        current.filter((item) => item.id !== id)
      );

      setSuccess('Feedback deleted successfully.');

      if (editingId === id) {
        cancelForm();
      }
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
    <div
      style={{
        padding: '20px',
        fontFamily: 'sans-serif',
        color: '#222',
      }}
    >
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

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px' }}>{ic.name}</h1>
          <p style={{ margin: 0, color: '#666' }}>{ic.title}</p>
          <p style={{ margin: '6px 0 0', color: '#666' }}>
            IC ID: {ic.IC_id}
          </p>
        </div>

        <button
          type="button"
          onClick={startCreate}
          style={{
            ...buttonStyle,
            background: '#2563eb',
            color: '#fff',
          }}
        >
          + Add feedback
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            overflowWrap: 'anywhere',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            background: '#dcfce7',
            color: '#166534',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
          }}
        >
          {success}
        </div>
      )}

      <section
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={statCardStyle}>
          <p style={statLabelStyle}>Total feedbacks</p>
          <p style={statValueStyle}>{feedbacks.length}</p>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>Average score</p>
          <p style={statValueStyle}>
            {feedbacks.length > 0 ? averageScore.toFixed(1) : '—'}
            <span style={{ fontSize: '15px', color: '#777' }}>
              {' '}
              / 5
            </span>
          </p>
        </div>

        <div style={statCardStyle}>
          <p style={statLabelStyle}>Latest feedback</p>
          <p style={{ ...statValueStyle, fontSize: '18px' }}>
            {sortedFeedbacks[0]?.date
              ? sortedFeedbacks[0].date.slice(0, 10)
              : '—'}
          </p>
        </div>
      </section>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ marginTop: 0, fontSize: '18px' }}>
          Score distribution
        </h2>

        {scoreCounts.map(({ score, count }) => (
          <div
            key={score}
            style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 32px',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '12px',
            }}
          >
            <span>{score} ★</span>

            <div
              style={{
                background: '#eee',
                height: '12px',
                borderRadius: '10px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(count / maxCount) * 100}%`,
                  height: '100%',
                  background: '#f59e0b',
                  borderRadius: '10px',
                  transition: 'width 0.2s',
                }}
              />
            </div>

            <span style={{ textAlign: 'right' }}>{count}</span>
          </div>
        ))}
      </section>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            border: '1px solid #d1d5db',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            background: '#fafafa',
          }}
        >
          <h2
            style={{
              gridColumn: '1 / -1',
              margin: 0,
              fontSize: '20px',
            }}
          >
            {editingId === null ? 'Create feedback' : 'Edit feedback'}
          </h2>

          <label>
            Author ID *
            <input
              name="author_id"
              type="number"
              min="1"
              step="1"
              value={form.author_id}
              onChange={handleFormChange}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Project ID *
            <input
              name="project_id"
              type="number"
              min="1"
              step="1"
              value={form.project_id}
              onChange={handleFormChange}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Date *
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleFormChange}
              required
              style={inputStyle}
            />
          </label>

          <label>
            Source *
            <input
              name="source_name"
              type="text"
              value={form.source_name}
              onChange={handleFormChange}
              required
              placeholder="e.g. Interview, survey"
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
              <option value="1">1 - Very poor</option>
              <option value="2">2 - Poor</option>
              <option value="3">3 - Average</option>
              <option value="4">4 - Good</option>
              <option value="5">5 - Excellent</option>
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
              rows={4}
              placeholder="Write a comment..."
              style={{
                ...inputStyle,
                resize: 'vertical',
              }}
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
                background: saving ? '#9ca3af' : '#2563eb',
                color: '#fff',
                cursor: saving ? 'wait' : 'pointer',
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
                background: '#e5e7eb',
                color: '#222',
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <section>
        <h2 style={{ fontSize: '20px' }}>Feedback history</h2>

        {loading ? (
          <p>Loading feedback...</p>
        ) : sortedFeedbacks.length === 0 ? (
          <p style={{ color: '#666' }}>
            No feedback has been registered for this IC yet.
          </p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '16px',
            }}
          >
            {sortedFeedbacks.map((item) => (
              <article
                key={item.id}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  padding: '18px',
                  background: '#fff',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <p
                      style={{
                        margin: '0 0 8px',
                        fontSize: '18px',
                        fontWeight: 700,
                      }}
                    >
                      {'★'.repeat(
                        Math.max(
                          0,
                          Math.min(5, Number(item.score))
                        )
                      )}
                      <span style={{ color: '#d1d5db' }}>
                        {'★'.repeat(
                          5 -
                            Math.max(
                              0,
                              Math.min(5, Number(item.score))
                            )
                        )}
                      </span>
                      <span
                        style={{
                          fontSize: '14px',
                          marginLeft: '8px',
                        }}
                      >
                        {item.score}/5
                      </span>
                    </p>

                    <p style={{ margin: '0 0 6px', color: '#666' }}>
                      {item.date?.slice(0, 10) || 'No date'} ·{' '}
                      {item.source_name}
                    </p>

                    <p style={{ margin: '0 0 6px', color: '#666' }}>
                      Author ID: {item.author_id} · Project ID:{' '}
                      {item.project_id ?? '—'}
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      style={{
                        ...buttonStyle,
                        background: '#e5e7eb',
                        color: '#222',
                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      style={{
                        ...buttonStyle,
                        background: '#fee2e2',
                        color: '#991b1b',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {item.comment && (
                  <p
                    style={{
                      whiteSpace: 'pre-wrap',
                      overflowWrap: 'anywhere',
                      margin: '14px 0 0',
                    }}
                  >
                    {item.comment}
                  </p>
                )}

                {item.screenshot_url && (
                  <p style={{ marginBottom: 0 }}>
                    <a
                      href={item.screenshot_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View screenshot
                    </a>
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default ICView;
