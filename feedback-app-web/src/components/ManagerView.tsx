import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import type { ManagerFeedback as Feedback, Project } from '../types/feedback';
import {
  obtainAllManagerFeedback,
  obtainManagerFeedbackPage,
  saveManagerFeedback,
  deleteManagerFeedback,
  uploadManagerFeedbackScreenshot,
  type ManagerInfo,
} from '../service/ManagerFeedbackApi';
import { formatDate, getInitials, truncateText, MAX_NAME_LEN, MAX_SOURCE_LEN, MAX_BODY_LEN, MAX_SOURCE_TITLE_LEN, MAX_COMMENT_LEN } from '../utils/feedbackFormat';
import { obtainProjects } from '../service/ObtainProjects';
import '../styles/IcView.css';
import { UserAvatar } from './UserAvatar';
import { resolveScreenshotUrl } from '../service/screenshotUrl';
import { useToastStore } from '../store/toastStore';
import LoadingOverlay from './LoadingOverlay';

type ManagerViewProps = {
  manager: ManagerInfo;
  areaName?: string;
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

const MAX_SCREENSHOT_BYTES = 100 * 1024 * 1024;
const TIMELINE_FEEDBACK_LIMIT = 20;
const ALLOWED_SCREENSHOT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const today = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
};

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

function ManagerView({ manager, areaName, onBack }: ManagerViewProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [timelineFeedbacks, setTimelineFeedbacks] = useState<Feedback[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteClosing, setIsDeleteClosing] = useState(false);
  const [editingItem, setEditingItem] = useState<Feedback | null>(null);
  const [form, setForm] = useState<EntryForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const screenshotFilePreview = useMemo(
    () => (screenshotFile ? URL.createObjectURL(screenshotFile) : null),
    [screenshotFile]
  );
  useEffect(() => {
    return () => {
      if (screenshotFilePreview) URL.revokeObjectURL(screenshotFilePreview);
    };
  }, [screenshotFilePreview]);

  function handleScreenshotChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && !ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
      setFormError('Screenshot must be a PNG, JPEG or WebP image.');
      event.target.value = '';
      return;
    }
    if (file && file.size > MAX_SCREENSHOT_BYTES) {
      setFormError('Screenshot is too large (max 100 MB).');
      event.target.value = '';
      return;
    }
    setFormError('');
    setScreenshotFile(file);
  }

  function removeScreenshot() {
    setScreenshotFile(null);
    setForm((current) => ({ ...current, screenshot_url: '' }));
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  }

  async function loadFeedbacks() {
    setLoading(true);
    setError('');

    try {
      const filters = { managerId: manager.id, sortBy: 'newest' as const };
      const [data, timeline] = await Promise.all([
        obtainAllManagerFeedback(filters),
        obtainManagerFeedbackPage(1, TIMELINE_FEEDBACK_LIMIT, filters),
      ]);
      setFeedbacks(data);
      setTimelineFeedbacks(timeline.data);
    } catch (err) {
      console.error('Error loading feedback:', err);
      setError('Could not load feedbacks. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFeedbacks();
  }, [manager.id]);

  useEffect(() => {
    obtainProjects().then(setProjects);
  }, []);

  const newestFirst = useMemo(
    () => [...feedbacks].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')),
    [feedbacks]
  );

  const oldestFirstScores = useMemo(
    () =>
      [...timelineFeedbacks]
        .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? '') || a.id - b.id)
        .map((item) => Number(item.score)),
    [timelineFeedbacks]
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
    setScreenshotFile(null);
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
      source_title: item.source_title ?? '',
      comment: item.comment ?? '',
      score: String(item.score),
      screenshot_url: item.screenshot_url ?? '',
    });
    setScreenshotFile(null);
    setFormError('');
    setError('');
    setSuccess('');
    setModalOpen(true);
  }

  function closeModal() {
    if (isClosing) return;

    setIsClosing(true);
    window.setTimeout(() => {
      setModalOpen(false);
      setEditingItem(null);
      setScreenshotFile(null);
      setFormError('');
      setIsClosing(false);
    }, 75);
  }

  const commentIsDirty =
    form.comment.trim() !== '' && form.comment.trim() !== (editingItem?.comment ?? '').trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');

    const projectId = Number(form.project_id);
    const score = Number(form.score);

    if (form.project_id === '' || !Number.isInteger(projectId) || projectId <= 0) {
      setFormError('Select a project.');
      return;
    }
    if (!form.date) {
      setFormError('Date is required.');
      return;
    }
    if (form.date > today()) {
      setFormError('Date cannot be in the future.');
      return;
    }
    if (!form.source_name.trim()) {
      setFormError('Source is required.');
      return;
    }
    if (form.source_name.trim().length > MAX_SOURCE_LEN) {
      setFormError(`Source must be at most ${MAX_SOURCE_LEN} characters.`);
      return;
    }
    if (!form.source_title.trim()) {
      setFormError('Source title is required.');
      return;
    }
    if (form.source_title.trim().length > MAX_SOURCE_TITLE_LEN) {
      setFormError(`Source title must be at most ${MAX_SOURCE_TITLE_LEN} characters.`);
      return;
    }
    if (form.comment.trim().length > MAX_COMMENT_LEN) {
      setFormError(`Comment must be at most ${MAX_COMMENT_LEN} characters.`);
      return;
    }
    if (!Number.isInteger(score) || score < 1 || score > 5) {
      setFormError('Score must be between 1 and 5.');
      return;
    }

    setSaving(true);

    try {
      let screenshotUrl: string | null = form.screenshot_url.trim() || null;

      if (screenshotFile) {
        screenshotUrl = await uploadManagerFeedbackScreenshot(screenshotFile);
      }

      // The author is the logged-in director; the API takes it from the token.
      const payload = {
        manager_id: manager.id,
        project_id: projectId,
        date: form.date,
        source_name: form.source_name.trim(),
        source_title: form.source_title.trim(),
        score,
        comment: form.comment.trim() || null,
        screenshot_url: screenshotUrl,
      };

      const isEditing = editingItem !== null;
      await saveManagerFeedback(payload, editingItem?.id);

      closeModal();
      useToastStore.getState().addToast(`Entry ${isEditing ? 'updated' : 'created'} successfully!`, 'success');
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

  function requestDelete(item: Feedback) {
    setIsDeleteClosing(false);
    setDeleteTarget(item);
  }

  function closeDeleteDialog() {
    if (isDeleting || isDeleteClosing) return;

    setIsDeleteClosing(true);
    window.setTimeout(() => {
      setDeleteTarget(null);
      setIsDeleteClosing(false);
    }, 75);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    const id = deleteTarget.id;

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      await deleteManagerFeedback(id);

      setDeleteTarget(null);
      useToastStore.getState().addToast('Entry deleted successfully.', 'success');
      await loadFeedbacks();

      if (editingItem?.id === id) {
        closeModal();
      }
    } catch (err) {
        console.error('Error deleting feedback:', err);
        
        const errorMessage = err instanceof Error
          ? `Could not delete entry: ${err.message}`
          : 'Could not delete entry.';

        useToastStore.getState().addToast(errorMessage, 'error');
      } finally {
        setIsDeleting(false);
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
            aria-label="Back to My Managers"
          >
            <i className="fa-solid fa-arrow-left" />
          </button>
          <h1 className="icv-title">{manager.name}</h1>
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
          <UserAvatar
                    name={manager.name}
                    id={manager.id}
                    entityType="manager"
                    size={48}
                    className="team-metric-avatar"
                  />
          <div>
            <div className="icv-person-name">{manager.name}</div>
            <div className="icv-person-role">{areaName ?? manager.email}</div>
          </div>
        </div>

        <div className="icv-stats">
          <div className="icv-stat">
            <span className="icv-stat-label">Average</span>
            {averageScore === null ? (
              <span className="icv-stat-value"> </span>
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
        {loading && <LoadingOverlay message="Loading feedback..." />}

        {!loading && newestFirst.length === 0 && (
          <p className="icv-muted">No feedback has been registered for this manager yet.</p>
        )}

        {!loading &&
          newestFirst.map((item) => (
            <article key={item.id} className="icv-entry animate-slide-up">
              <div className="icv-entry-head animate-slide-up">
                <div className="icv-entry-meta">
                  <span className="score-badge" data-score={item.score}>
                    {item.score}
                  </span>
                  <span className="icv-entry-meta-text" title={`${formatDate(item.date)} · ${projectNameOf(item)} · ${item.source_name}`}>
                    {formatDate(item.date)} · {truncateText(projectNameOf(item), MAX_NAME_LEN)} · {truncateText(item.source_name, MAX_SOURCE_LEN)}
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
                    onClick={() => requestDelete(item)}
                    aria-label="Delete entry"
                  >
                    <i className="fa-solid fa-trash-can" />
                  </button>
                </div>
              </div>

              {item.comment && <p className="icv-entry-body">{truncateText(item.comment, MAX_BODY_LEN)}</p>}

              {item.screenshot_url && (
                <button
                  type="button"
                  className="icv-thumb-btn"
                  onClick={() => setPreviewUrl(item.screenshot_url)}
                  aria-label="View screenshot"
                >
                  <img
                    className="icv-thumb"
                    src={resolveScreenshotUrl(item.screenshot_url)}
                    alt="Screenshot attached to this entry"
                  />
                </button>
              )}
            </article>
          ))}
      </section>

      {deleteTarget && (
        <div
          className={`icv-overlay${isDeleteClosing ? ' is-closing' : ''}`}
          onClick={closeDeleteDialog}
        >
          <div
            className="icv-modal icv-delete-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="icv-delete-title"
            aria-describedby="icv-delete-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="icv-form">
              <h2 id="icv-delete-title">Delete Entry</h2>
              <p id="icv-delete-description" className="icv-delete-message">
                Are you sure you want to delete this entry? This action cannot be undone.
              </p>
              <div className="icv-modal-actions">
                <button
                  type="button"
                  className="icv-ghost-btn"
                  onClick={closeDeleteDialog}
                  disabled={isDeleting}
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="icv-danger-btn"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          className={`icv-overlay${isClosing ? ' is-closing' : ''}`}
          onClick={closeModal}
        >
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
                  max={today()}
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
                <span className="icv-label">Source (who this feedback is from) *</span>
                <input
                  className="input-control"
                  name="source_name"
                  type="text"
                  maxLength={MAX_SOURCE_LEN}
                  value={form.source_name}
                  onChange={handleFieldChange}
                  placeholder="e.g. Stakeholder Review, Peer Feedback"
                  required
                />
              </label>

              <label className="icv-field">
                <span className="icv-label">Source title *</span>
                <input
                  className="input-control"
                  name="source_title"
                  type="text"
                  maxLength={MAX_SOURCE_TITLE_LEN}
                  value={form.source_title}
                  onChange={handleFieldChange}
                  placeholder="e.g. Product Manager, Client, Peer"
                  required
                />
          
              </label>

              <label className="icv-field">
                <span className="icv-label">Comment</span>
                <textarea
                  name="comment"
                  className={
                    form.comment.length >= MAX_COMMENT_LEN
                      ? 'is-error'
                      : commentIsDirty
                        ? 'is-success'
                        : ''
                  }
                  maxLength={MAX_COMMENT_LEN}
                  value={form.comment}
                  onChange={handleFieldChange}
                  placeholder="Add a short note..."
                  rows={4}
                />
                <span
                  className={`icv-hint${
                    form.comment.length >= MAX_COMMENT_LEN
                      ? ' is-error'
                      : commentIsDirty
                        ? ' is-success'
                        : ''
                  }`}
                >
                  {form.comment.length >= MAX_COMMENT_LEN
                    ? `Maximum of ${MAX_COMMENT_LEN} characters reached.`
                    : commentIsDirty
                      ? `Looks good. ${form.comment.length}/${MAX_COMMENT_LEN}`
                      : `Up to ${MAX_COMMENT_LEN} characters.`}
                </span>
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

              <div className="icv-field">
                <span className="icv-label">Screenshot (optional)</span>
                <div className="icv-file-row">
                  <label
                    htmlFor="icv-screenshot"
                    className="btn btn-secondary icv-file-btn"
                  >
                    <i className="fa-solid fa-image" aria-hidden="true" />
                    {screenshotFilePreview || form.screenshot_url
                      ? 'Change screenshot'
                      : 'Upload screenshot'}
                  </label>
                  <span className="icv-file-name">
                    {screenshotFile?.name ?? 'PNG, JPEG or WebP'}
                  </span>
                </div>
                <input
                  id="icv-screenshot"
                  ref={screenshotInputRef}
                  className="icv-file-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleScreenshotChange}
                />
                {(screenshotFilePreview || form.screenshot_url) && (
                  <>
                    <img
                      className="icv-thumb"
                      src={screenshotFilePreview ?? resolveScreenshotUrl(form.screenshot_url)}
                      alt="Screenshot to attach"
                    />
                    <button
                      type="button"
                      className="icv-ghost-btn"
                      onClick={removeScreenshot}
                      disabled={saving}
                    >
                      Remove screenshot
                    </button>
                  </>
                )}
              </div>

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

      {previewUrl && (
        <div
          className="icv-overlay is-dark"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            className="icv-preview-img"
            src={resolveScreenshotUrl(previewUrl)}
            alt="Screenshot preview"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default ManagerView;