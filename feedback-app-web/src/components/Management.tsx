import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import {
  deleteManagementRow,
  loadManagementData,
  saveManagementRow,
  updateManagerArea,
  type ManagementData,
  type ManagementFormValues,
  type ManagementRow,
  type ManagementTab,
} from '../service/ManagementApi';
import { useAuthStore } from '../store/authStore';
import '../styles/Management.css';

type ViewMode = 'table' | 'cards';

const TABS: ManagementTab[] = ['Areas', 'Managers', 'ICs', 'Projects'];

const COLUMNS: Record<ManagementTab, { label: string; key: keyof ManagementRow }[]> = {
  Areas: [
    { label: 'Name', key: 'name' },
    { label: 'Managers', key: 'managers' },
    { label: 'ICs', key: 'ics' },
    { label: 'Average Score', key: 'averageScore' },
  ],
  Managers: [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Area', key: 'area' },
    { label: 'ICs', key: 'ics' },
    { label: 'Average Score', key: 'averageScore' },
  ],
  ICs: [
    { label: 'Name', key: 'name' },
    { label: 'Title', key: 'title' },
    { label: 'Manager', key: 'manager' },
  ],
  Projects: [
    { label: 'Name', key: 'name' },
    { label: 'Entries', key: 'entries' },
  ],
};

const TAB_SINGULAR: Record<ManagementTab, string> = {
  Areas: 'Area',
  Managers: 'Manager',
  ICs: 'IC',
  Projects: 'Project',
};

const EMPTY_FORM: ManagementFormValues = {
  name: '',
  email: '',
  password: '',
  areaId: '',
  title: '',
  managerId: '',
  entries: '0',
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function ManagementComp() {
  const token = useAuthStore((state) => state.token);
  const [activeTab, setActiveTab] = useState<ManagementTab>('Areas');
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    if (mediaQuery.matches) {
      setViewMode('cards');
    }

    const handleMediaChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setViewMode('cards');
      }
    };

    mediaQuery.addEventListener('change', handleMediaChange);
    return () => mediaQuery.removeEventListener('change', handleMediaChange);
    }, []);


  const [rows, setRows] = useState<ManagementRow[]>([]);
  const [areas, setAreas] = useState<ManagementData['areas']>([]);
  const [managers, setManagers] = useState<ManagementData['managers']>([]);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ManagementRow | null>(null);
  const [feedbackManager, setFeedbackManager] = useState<ManagementRow | null>(null);
  const [formValues, setFormValues] = useState<ManagementFormValues>(EMPTY_FORM);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);

    if (!token) {
      setRows([]);
      setError('You must be logged in to load management data.');
      setLoading(false);
      return () => {
        isCurrent = false;
      };
    }

    loadManagementData(activeTab, token)
      .then((data) => {
        if (isCurrent) {
          setRows(data.rows);
          setAreas(data.areas);
          setManagers(data.managers);
        }
      })
      .catch((reason: unknown) => {
        if (!isCurrent) return;
        console.error(`Could not load ${activeTab.toLowerCase()}:`, reason);
        setError(getErrorMessage(reason));
      })
      .finally(() => {
        if (isCurrent) setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeTab, token]);

  const openAddDialog = () => {
    setEditingRow(null);
    setFormValues({
      ...EMPTY_FORM,
      areaId: areas[0] ? String(areas[0].id) : '',
      managerId: managers[0] ? String(managers[0].id) : '',
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (row: ManagementRow) => {
    setEditingRow(row);
    setFormValues({
      ...EMPTY_FORM,
      name: row.name,
      email: row.email ?? '',
      areaId: row.areaId === undefined ? '' : String(row.areaId),
      title: row.title ?? '',
      managerId: row.managerId === undefined ? '' : String(row.managerId),
      entries: String(row.entries ?? 0),
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingRow(null);
    setFormValues(EMPTY_FORM);
    setError(null);
  };

  const updateFormValue = (key: keyof ManagementFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const refreshRows = async () => {
    if (!token) throw new Error('You must be logged in to load management data.');
    const data = await loadManagementData(activeTab, token);
    setRows(data.rows);
    setAreas(data.areas);
    setManagers(data.managers);
  };

  const saveRow = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError('You must be logged in to save changes.');
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      await saveManagementRow(activeTab, editingRow?.id ?? null, formValues, token);
      await refreshRows();
      closeDialog();
    } catch (reason: unknown) {
      console.error(`Could not save ${activeTab.toLowerCase()}:`, reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteRow = async (row: ManagementRow) => {
    if (!token || !window.confirm(`Delete ${row.name}?`)) return;

    setIsMutating(true);
    setError(null);
    try {
      await deleteManagementRow(activeTab, row.id, token);
      await refreshRows();
    } catch (reason: unknown) {
      console.error(`Could not delete ${activeTab.toLowerCase()}:`, reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const changeManagerArea = async (row: ManagementRow, areaId: number) => {
    if (!token || row.areaId === areaId) return;

    setIsMutating(true);
    setError(null);
    try {
      await updateManagerArea(row.id, areaId, token);
      await refreshRows();
    } catch (reason: unknown) {
      console.error('Could not update manager area:', reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const renderCell = (row: ManagementRow, key: keyof ManagementRow) => {
    const value = row[key];
    if (key === 'averageScore' && typeof value === 'number') {
      if (activeTab === 'Managers') {
        const scoreClass = value >= 4 ? 'management-score-high' : 'management-score-low';
        return <span className={`management-score ${scoreClass}`}>{Math.round(value)}</span>;
      }
      const scoreClass = value >= 4 ? 'management-score-high' : 'management-score-low';
      return <span className={`management-score ${scoreClass}`}>{value.toFixed(1)}</span>;
    }
    if (key === 'averageScore' && activeTab === 'Managers') {
      return <span className="management-no-score">No data</span>;
    }
    return value ?? '—';
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = TABS.indexOf(activeTab);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = TABS.length - 1;
    else return;

    event.preventDefault();
    setActiveTab(TABS[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
      ?.focus();
  };

  return (
    <section className="management-page" aria-label="Director management">
      <div className="management-tabs" role="tablist" aria-label="Manage organization">
        {TABS.map((tab) => (
          <button
            key={tab}
            id={`management-tab-${tab}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            aria-controls="management-panel"
            tabIndex={activeTab === tab ? 0 : -1}
            className={`management-tab${activeTab === tab ? ' is-active' : ''}`}
            onClick={() => setActiveTab(tab)}
            onKeyDown={handleTabKeyDown}
            disabled={isMutating}
          >
            {tab}
          </button>
        ))}
      </div>

      <div
        id="management-panel"
        className="management-panel"
        role="tabpanel"
        aria-labelledby={`management-tab-${activeTab}`}
      >
        <div className="management-toolbar">
          <button
            type="button"
            className="management-add-button"
            onClick={openAddDialog}
            disabled={loading || isMutating}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Add {TAB_SINGULAR[activeTab]}
          </button>

          <div className="management-view-toggle" role="group" aria-label="Choose layout">
            <button
              type="button"
              className={`management-view-button${viewMode === 'cards' ? ' is-active' : ''}`}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
            >
              <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z" />
              </svg>
            </button>
            <button
              type="button"
              className={`management-view-button${viewMode === 'table' ? ' is-active' : ''}`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z" />
              </svg>
            </button>
          </div>
        </div>

        {error && !isDialogOpen && (
          <p className="management-error" role="alert">
            Could not complete the request: {error}
          </p>
        )}
        {error && isDialogOpen && (
          <p className="management-error" role="alert">
            Could not complete the request: {error}
          </p>
        )}
        {loading ? (
          <p className="management-loading" role="status">Loading {activeTab.toLowerCase()}...</p>
        ) : error && !isDialogOpen ? null : rows.length === 0 ? (
          <p className="management-empty-state">No {activeTab.toLowerCase()} to display.</p>
        ) : viewMode === 'table' ? (
          <div className="management-table-wrap">
            <table className={`management-table${activeTab === 'Managers' ? ' management-managers-table' : ''}`}>
              <thead>
                <tr>
                  {COLUMNS[activeTab].map(({ label }) => <th key={label}>{label}</th>)}
                  <th><span className="management-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS[activeTab].map(({ key, label }) => (
                      <td key={key} data-label={label}>
                        {activeTab === 'Managers' && key === 'area' ? (
                          <select
                            className="management-area-select"
                            aria-label={`Area for ${row.name}`}
                            value={row.areaId ?? ''}
                            disabled={isMutating || areas.length === 0}
                            onChange={(event) => void changeManagerArea(row, Number(event.target.value))}
                          >
                            {row.areaId === undefined && <option value="">No area assigned</option>}
                            {areas.map((area) => (
                              <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                          </select>
                        ) : renderCell(row, key)}
                      </td>
                    ))}
                    <td className="management-actions-cell">
                      {activeTab === 'Managers' && (
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`View feedback for ${row.name}`}
                          title="View feedback"
                          onClick={() => setFeedbackManager(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-regular fa-message" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEditDialog(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => void deleteRow(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="management-cards">
            {rows.map((row) => (
              <article className="management-card" key={row.id}>
                <div className="management-card-heading">
                  <h2>{row.name}</h2>
                  <div className="management-card-actions">
                    <button
                      type="button"
                      className="management-row-action"
                      aria-label={`Edit ${row.name}`}
                      onClick={() => openEditDialog(row)}
                      disabled={isMutating}
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="management-row-action"
                      aria-label={`Delete ${row.name}`}
                      onClick={() => void deleteRow(row)}
                      disabled={isMutating}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <dl>
                  {COLUMNS[activeTab].slice(1).map(({ label, key }) => (
                    <div className="management-card-detail" key={key}>
                      <dt>{label}</dt>
                      <dd>{renderCell(row, key)}</dd>
                    </div>
                  ))}
                </dl>
                {activeTab === 'Managers' && (
                  <button
                    type="button"
                    className="management-feedback-button"
                    onClick={() => setFeedbackManager(row)}
                    disabled={isMutating}
                  >
                    <i className="fa-regular fa-message" aria-hidden="true" />
                    View feedback
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
        {feedbackManager && (
          <div className="management-dialog-backdrop" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setFeedbackManager(null);
          }}>
            <section
              className="management-dialog management-feedback-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="manager-feedback-title"
            >
              <h2 id="manager-feedback-title">{feedbackManager.name} — Feedback</h2>
              {feedbackManager.feedbackEntries?.length ? (
                <div className="management-feedback-list">
                  {feedbackManager.feedbackEntries.map((entry) => (
                    <article className="management-feedback-entry" key={entry.id}>
                      <div className="management-feedback-entry-heading">
                        <strong>{entry.icName}</strong>
                        <span className={`management-score ${entry.score >= 4 ? 'management-score-high' : 'management-score-low'}`}>
                          {entry.score}
                        </span>
                      </div>
                      <p>{entry.projectName} · {entry.date}</p>
                      <p>{entry.comment || 'No comment provided.'}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="management-empty-state">No feedback for this manager’s ICs yet.</p>
              )}
              <div className="management-dialog-actions">
                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={() => setFeedbackManager(null)}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div className="management-dialog-backdrop">
          <form
            className="management-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="management-dialog-title"
            onSubmit={saveRow}
          >
            <h2 id="management-dialog-title">
              {editingRow === null ? `Add ${TAB_SINGULAR[activeTab]}` : `Edit ${TAB_SINGULAR[activeTab]}`}
            </h2>
            <label htmlFor="management-name">Name</label>
            <input
              id="management-name"
              autoFocus
              required
              minLength={activeTab === 'Areas' || activeTab === 'Managers' ? 2 : 1}
              value={formValues.name}
              onChange={(event) => updateFormValue('name', event.target.value)}
            />

            {activeTab === 'Managers' && (
              <>
                <label htmlFor="management-email">Email</label>
                <input
                  id="management-email"
                  type="email"
                  required
                  value={formValues.email}
                  onChange={(event) => updateFormValue('email', event.target.value)}
                />
                {editingRow === null && (
                  <>
                    <label htmlFor="management-password">Temporary password</label>
                    <input
                      id="management-password"
                      type="password"
                      minLength={8}
                      required
                      value={formValues.password}
                      onChange={(event) => updateFormValue('password', event.target.value)}
                    />
                  </>
                )}
                <label htmlFor="management-area">Area</label>
                <select
                  id="management-area"
                  required
                  value={formValues.areaId}
                  onChange={(event) => updateFormValue('areaId', event.target.value)}
                >
                  <option value="" disabled>Select an area</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
                {areas.length === 0 && <p className="management-form-hint">Create an area before adding a manager.</p>}
              </>
            )}

            {activeTab === 'ICs' && (
              <>
                <label htmlFor="management-title">Title</label>
                <input
                  id="management-title"
                  required
                  value={formValues.title}
                  onChange={(event) => updateFormValue('title', event.target.value)}
                />
                <label htmlFor="management-manager">Manager</label>
                <select
                  id="management-manager"
                  required
                  value={formValues.managerId}
                  onChange={(event) => updateFormValue('managerId', event.target.value)}
                >
                  <option value="" disabled>Select a manager</option>
                  {managers.map((manager) => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
                {managers.length === 0 && <p className="management-form-hint">Create a manager before adding an IC.</p>}
              </>
            )}

            {error && <p className="management-error" role="alert">{error}</p>}
            <div className="management-dialog-actions">
              <button type="button" className="management-cancel-button" onClick={closeDialog} disabled={isMutating}>
                Cancel
              </button>
              <button
                type="submit"
                className="management-add-button"
                disabled={isMutating || (activeTab === 'Managers' && areas.length === 0) || (activeTab === 'ICs' && managers.length === 0)}
              >
                {isMutating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export default ManagementComp;
