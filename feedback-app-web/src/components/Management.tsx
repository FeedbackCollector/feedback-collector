import { useState, type FormEvent, type KeyboardEvent } from 'react';
import '../styles/Management.css';

type ManagementTab = 'Areas' | 'Managers' | 'ICs' | 'Projects';
type ViewMode = 'table' | 'cards';

interface ManagementRow {
  id: number;
  name: string;
  managers?: number;
  ics?: number;
  averageScore?: number;
  area?: string;
  manager?: string;
  entries?: number;
}

const TABS: ManagementTab[] = ['Areas', 'Managers', 'ICs', 'Projects'];

const INITIAL_ROWS: Record<ManagementTab, ManagementRow[]> = {
  Areas: [
    { id: 1, name: 'Design', managers: 3, ics: 3, averageScore: 3 },
    { id: 2, name: 'Delivery', managers: 2, ics: 6, averageScore: 4 },
    { id: 3, name: 'Engineering', managers: 2, ics: 5, averageScore: 4 },
    { id: 4, name: 'Product', managers: 2, ics: 4, averageScore: 4 },
  ],
  Managers: [
    { id: 1, name: 'Alex Morgan', area: 'Design', ics: 3 },
    { id: 2, name: 'Jordan Lee', area: 'Delivery', ics: 6 },
    { id: 3, name: 'Taylor Smith', area: 'Engineering', ics: 5 },
  ],
  ICs: [
    { id: 1, name: 'Sam Rivera', manager: 'Alex Morgan', area: 'Design' },
    { id: 2, name: 'Casey Park', manager: 'Jordan Lee', area: 'Delivery' },
    { id: 3, name: 'Riley Chen', manager: 'Taylor Smith', area: 'Engineering' },
  ],
  Projects: [
    { id: 1, name: 'Design System', area: 'Design', entries: 12 },
    { id: 2, name: 'Delivery Improvements', area: 'Delivery', entries: 8 },
    { id: 3, name: 'Platform Upgrade', area: 'Engineering', entries: 16 },
  ],
};

const COLUMNS: Record<ManagementTab, { label: string; key: keyof ManagementRow }[]> = {
  Areas: [
    { label: 'Name', key: 'name' },
    { label: 'Managers', key: 'managers' },
    { label: 'ICs', key: 'ics' },
    { label: 'Average Score', key: 'averageScore' },
  ],
  Managers: [
    { label: 'Name', key: 'name' },
    { label: 'Area', key: 'area' },
    { label: 'ICs', key: 'ics' },
  ],
  ICs: [
    { label: 'Name', key: 'name' },
    { label: 'Manager', key: 'manager' },
    { label: 'Area', key: 'area' },
  ],
  Projects: [
    { label: 'Name', key: 'name' },
    { label: 'Area', key: 'area' },
    { label: 'Entries', key: 'entries' },
  ],
};

const TAB_SINGULAR: Record<ManagementTab, string> = {
  Areas: 'Area',
  Managers: 'Manager',
  ICs: 'IC',
  Projects: 'Project',
};

function createRow(tab: ManagementTab, id: number, name: string): ManagementRow {
  switch (tab) {
    case 'Areas':
      return { id, name, managers: 0, ics: 0, averageScore: 0 };
    case 'Managers':
      return { id, name, area: 'Design', ics: 0 };
    case 'ICs':
      return { id, name, manager: 'Unassigned', area: 'Design' };
    case 'Projects':
      return { id, name, area: 'Design', entries: 0 };
  }
}

export default function ManagementComp() {
  const [activeTab, setActiveTab] = useState<ManagementTab>('Areas');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [rowsByTab, setRowsByTab] = useState(INITIAL_ROWS);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState('');
  const rows = rowsByTab[activeTab];
  const columns = COLUMNS[activeTab];

  const openAddDialog = () => {
    setEditingId(null);
    setNameInput('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (row: ManagementRow) => {
    setEditingId(row.id);
    setNameInput(row.name);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setNameInput('');
  };

  const saveRow = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = nameInput.trim();
    if (!name) return;

    setRowsByTab((current) => {
      const currentRows = current[activeTab];
      const updatedRows = editingId === null
        ? [...currentRows, createRow(activeTab, Date.now(), name)]
        : currentRows.map((row) => row.id === editingId ? { ...row, name } : row);
      return { ...current, [activeTab]: updatedRows };
    });
    closeDialog();
  };

  const deleteRow = (id: number) => {
    setRowsByTab((current) => ({
      ...current,
      [activeTab]: current[activeTab].filter((row) => row.id !== id),
    }));
  };

  const renderCell = (row: ManagementRow, key: keyof ManagementRow) => {
    const value = row[key];
    if (key === 'averageScore' && typeof value === 'number') {
      const scoreClass = value >= 4 ? 'management-score-high' : 'management-score-low';
      return <span className={`management-score ${scoreClass}`}>{value}</span>;
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
              <i className="fa-solid fa-table-cells-large" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`management-view-button${viewMode === 'table' ? ' is-active' : ''}`}
              aria-label="Table view"
              aria-pressed={viewMode === 'table'}
              onClick={() => setViewMode('table')}
            >
              <i className="fa-solid fa-table-list" aria-hidden="true" />
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  {columns.map(({ label }) => <th key={label}>{label}</th>)}
                  <th><span className="management-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    {columns.map(({ key, label }) => (
                      <td key={key} data-label={label}>{renderCell(row, key)}</td>
                    ))}
                    <td className="management-actions-cell">
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => openEditDialog(row)}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => deleteRow(row.id)}
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
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="management-row-action"
                      aria-label={`Delete ${row.name}`}
                      onClick={() => deleteRow(row.id)}
                    >
                      <i className="fa-regular fa-trash-can" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <dl>
                  {columns.slice(1).map(({ label, key }) => (
                    <div className="management-card-detail" key={key}>
                      <dt>{label}</dt>
                      <dd>{renderCell(row, key)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>
        )}

        {rows.length === 0 && (
          <p className="management-empty-state">No {activeTab.toLowerCase()} to display.</p>
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
              {editingId === null ? `Add ${TAB_SINGULAR[activeTab]}` : `Edit ${TAB_SINGULAR[activeTab]}`}
            </h2>
            <label htmlFor="management-name">Name</label>
            <input
              id="management-name"
              autoFocus
              required
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
            />
            <div className="management-dialog-actions">
              <button type="button" className="management-cancel-button" onClick={closeDialog}>
                Cancel
              </button>
              <button type="submit" className="management-add-button">
                Save
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
