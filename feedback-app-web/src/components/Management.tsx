import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approvePendingAccount,
  deleteManagementRow,
  loadManagementData,
  saveManagementRow,
  updateManagerArea,
  updateICManager,
} from '../service/ManagementApi';
import type {
  ManagementData,
  ManagementFormValues,
  PendingAccount,
  ManagementRow,
  ManagementTab,
} from '../types/managementTypes';
import { useAuthStore } from '../store/authStore';
import { normalizeSearchText } from '../utils/search';
import '../styles/Management.css';
import {useToastStore} from '../store/toastStore';
import LoadingOverlay from './LoadingOverlay';
import { formatPersonName } from './formatPersonName';

type ViewMode = 'table' | 'cards';

const TABS: ManagementTab[] = ['Areas', 'Managers', 'ICs', 'Projects'];

function formatManagementName(name: string, tab: ManagementTab): string {
  return tab === 'Managers' || tab === 'ICs' ? formatPersonName(name) : name;
}

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

const PAGE_SIZE = 10;
const arrowForward = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M8.03,22L6.25,20.23L14.48,12L6.25,3.77L8.03,2l10,10l-10,10Z"/></svg>;
const arrowBack = <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" height="10px" width="10px" fill="#1f1f1f"><path d="M10,22L0,12L10,2l1.78,1.77L3.55,12l8.23,8.23L10,22Z"/></svg>;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

type ManagementCompProps = {
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
};

function ManagementComp({ activeTab, onTabChange }: ManagementCompProps) {
  const token = useAuthStore((state) => state.token);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const viewContainerRef = useRef<HTMLDivElement>(null);
  const shouldAnimateViewChange = useRef(false);

  const changeViewMode = (nextMode: ViewMode) => {
    if (nextMode === viewMode) return;

    shouldAnimateViewChange.current = true;
    setViewMode(nextMode);
  };

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

  useEffect(() => {
    if (!shouldAnimateViewChange.current) return;

    shouldAnimateViewChange.current = false;
    viewContainerRef.current?.animate(
      [
        { opacity: 0, transform: 'translateY(16px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 300, easing: 'ease-out' }
    );
  }, [viewMode]);

  const [rows, setRows] = useState<ManagementRow[]>([]);
  const [areas, setAreas] = useState<ManagementData['areas']>([]);
  const [managers, setManagers] = useState<ManagementData['managers']>([]);
  const [individualContributors, setIndividualContributors] = useState<
    NonNullable<ManagementData['individualContributors']>
  >([]);
  const [icSearch, setICSearch] = useState('');
  const [pendingAccounts, setPendingAccounts] = useState<PendingAccount[]>([]);
  const [showPendingRequests, setShowPendingRequests] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ManagementRow | null>(null);
  const [assigningManager, setAssigningManager] = useState<ManagementRow | null>(null);
  const [selectedICIds, setSelectedICIds] = useState<number[]>([]);
  const [feedbackManager, setFeedbackManager] = useState<ManagementRow | null>(null);
  const [formValues, setFormValues] = useState<ManagementFormValues>(EMPTY_FORM);
  const [closingPopup, setClosingPopup] = useState<'feedback' | 'form' | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const pageParam = Number(searchParams.get('page'));
  const requestedPage = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
  const totalPages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const page = Math.min(requestedPage, totalPages);
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPage(next: number) {
    if (loading || next < 1 || next > totalPages || next === page) return;
    setSearchParams(next > 1 ? { page: String(next) } : {});
  }

  useEffect(() => {
    if (loading || requestedPage <= totalPages) return;
    setSearchParams(totalPages > 1 ? { page: String(totalPages) } : {}, { replace: true });
  }, [loading, requestedPage, totalPages, setSearchParams]);

  useEffect(() => {
    setShowPendingRequests(false);
  }, [activeTab]);

  useEffect(() => {
    let isCurrent = true;
    setLoading(true);
    setError(null);

    if (!token) {
      setRows([]);
      setPendingAccounts([]);
      setIndividualContributors([]);
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
          setPendingAccounts(data.pendingAccounts);
          setIndividualContributors(data.individualContributors ?? []);
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
    setClosingPopup(null);
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
    setClosingPopup(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
  if (closingPopup) return;

    setClosingPopup('form');
    window.setTimeout(() => {
      setIsDialogOpen(false);
      setEditingRow(null);
      setFormValues(EMPTY_FORM);
      setError(null);
      setClosingPopup(null);
    }, 300);
  };

  const closeFeedbackDialog = () => {
  if (closingPopup) return;

    setClosingPopup('feedback');
    window.setTimeout(() => {
      setFeedbackManager(null);
      setClosingPopup(null);
    }, 300);
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
    setPendingAccounts(data.pendingAccounts);
    setIndividualContributors(data.individualContributors ?? []);
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
      useToastStore.getState().addToast('Changes saved successfully!', 'success');
    } catch (reason: unknown) {
      console.error(`Could not save ${activeTab.toLowerCase()}:`, reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const deleteRow = async (row: ManagementRow) => {
    const displayName = formatManagementName(row.name, activeTab);
    if (!token || !window.confirm(`Delete ${displayName}?`)) return;

    setIsMutating(true);
    setError(null);
    try {
      await deleteManagementRow(activeTab, row.id, token);
      await refreshRows();
      useToastStore.getState().addToast(`${TAB_SINGULAR[activeTab]} deleted successfully!`, 'success');
    } catch (reason: unknown) {
      console.error(`Could not delete ${activeTab.toLowerCase()}:`, reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const approveAccount = async (account: PendingAccount) => {
    if (!token) {
      setError('You must be logged in to approve accounts.');
      return;
    }

    setIsMutating(true);
    setError(null);
    try {
      await approvePendingAccount(account.id, token);
      await refreshRows();
    } catch (reason: unknown) {
      console.error('Could not approve account:', reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const deletePendingAccount = async (account: PendingAccount) => {
    if (!token || !window.confirm(`Delete the account request for ${formatPersonName(account.name)}?`)) return;

    setIsMutating(true);
    setError(null);
    try {
      await deleteManagementRow('Managers', account.id, token);
      await refreshRows();
    } catch (reason: unknown) {
      console.error('Could not delete pending account:', reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const renderPendingActions = (account: PendingAccount) => (
    <div className="management-request-actions">
      <button
        type="button"
        className="management-request-approve"
        onClick={() => void approveAccount(account)}
        disabled={isMutating}
      >
        Approve
      </button>
      <button
        type="button"
        className="management-request-delete"
        onClick={() => void deletePendingAccount(account)}
        disabled={isMutating}
      >
        Delete
      </button>
    </div>
  );

  const changeManagerArea = async (row: ManagementRow, areaId: number) => {
    if (!token || row.areaId === areaId) return;

    setIsMutating(true);
    setError(null);
    try {
      await updateManagerArea(row.id, areaId, token);
      await refreshRows();
      useToastStore.getState().addToast('Manager area updated successfully!', 'success');
    } catch (reason: unknown) {
      console.error('Could not update manager area:', reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const openAssignDialog = (manager: ManagementRow) => {
    setAssigningManager(manager);
    setSelectedICIds([]);
    setICSearch('');
    setError(null);
  };

  const closeAssignDialog = () => {
    if (isMutating) return;
    setAssigningManager(null);
    setSelectedICIds([]);
    setICSearch('');
    setError(null);
  };

  const assignSelectedICs = async () => {
    if (!token || !assigningManager || selectedICIds.length === 0) return;

    setIsMutating(true);
    setError(null);
    try {
      const results = await Promise.allSettled(
        selectedICIds.map((icId) => updateICManager(icId, assigningManager.id, token))
      );
      await refreshRows();

      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        const firstFailure = failures[0];
        setSelectedICIds([]);
        setError(
          firstFailure.status === 'rejected'
            ? `Could not assign ${failures.length} IC${failures.length === 1 ? '' : 's'}: ${getErrorMessage(firstFailure.reason)}`
            : 'Could not assign ICs.'
        );
        return;
      }

      setAssigningManager(null);
      setSelectedICIds([]);
    } catch (reason: unknown) {
      console.error('Could not assign ICs to manager:', reason);
      setError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const renderCell = (row: ManagementRow, key: keyof ManagementRow) => {
    const value = row[key];
    if (key === 'name' && typeof value === 'string') {
      return formatManagementName(value, activeTab);
    }
    if (key === 'averageScore' && typeof value === 'number') {
      const rounded = Math.round(value);
      const scoreClass = rounded >= 4 ? 'management-score-high' : 'management-score-low';
      return <span className={`management-score ${scoreClass}`}>{rounded}</span>;
    }
    if (key === 'averageScore' && activeTab === 'Managers') {
      return <span className="management-no-score">No data</span>;
    }
    if (Array.isArray(value)) return '—';
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
    onTabChange(TABS[nextIndex]);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex]
      ?.focus();
  };

  const normalizedICSearch = normalizeSearchText(icSearch.trim());
  const filteredICs = individualContributors.filter((ic) =>
    normalizeSearchText(`${ic.name} ${ic.title}`).includes(normalizedICSearch)
  );

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
            onClick={() => onTabChange(tab)}
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
          {activeTab !== 'Managers' && (
            <button
              type="button"
              className="management-add-button"
              onClick={openAddDialog}
              disabled={loading || isMutating}
            >
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Add {TAB_SINGULAR[activeTab]}
            </button>
          )}

          <div className="management-view-toggle" role="group" aria-label="Management view">
            <button
              type="button"
              className={`management-view-button${viewMode === 'cards' ? ' is-active' : ''}`}
              aria-label="Card view"
              aria-pressed={viewMode === 'cards'}
              onClick={() => changeViewMode('cards')}
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
              onClick={() => changeViewMode('table')}
            >
              <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                <path d="M360-240h440v-107H360v107ZM160-613h120v-107H160v107Zm0 187h120v-107H160v107Zm0 186h120v-107H160v107Zm200-186h440v-107H360v107Zm0-187h440v-107H360v107ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Z" />
              </svg>
            </button>
            {activeTab === 'Managers' && (
              <button
                type="button"
                className={`management-view-button management-pending-toggle${showPendingRequests ? ' is-active' : ''}`}
                aria-pressed={showPendingRequests}
                onClick={() => setShowPendingRequests((showing) => !showing)}
                disabled={loading || isMutating}
              >
                {showPendingRequests ? 'Managers' : `Pending (${pendingAccounts.length})`}
              </button>
            )}
          </div>
        </div>

        {error && !isDialogOpen && !assigningManager && (
          <p className="management-error" role="alert">
            Could not complete the request: {error}
          </p>
        )}
        {loading ? (
          <LoadingOverlay message={`Loading ${activeTab.toLowerCase()}...`} />
        ) : error && !isDialogOpen && !assigningManager ? null : (
          <>
            {activeTab === 'Managers' && showPendingRequests ? (
              <section
                className="management-requests"
                id="management-pending-requests"
                aria-labelledby="management-requests-title"
              >
                <h2 className="management-requests-title" id="management-requests-title">
                  Pending account requests ({pendingAccounts.length})
                </h2>
                {pendingAccounts.length === 0 ? (
                  <p className="management-empty-state">There are no accounts waiting for approval.</p>
                ) : viewMode === 'table' ? (
                  <div className="management-table-wrap">
                    <table className="management-table management-requests-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Area</th>
                          <th><span className="management-visually-hidden">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingAccounts.map((account) => (
                          <tr key={account.id}>
                            <td data-label="Name">{formatPersonName(account.name)}</td>
                            <td data-label="Email">{account.email}</td>
                            <td data-label="Area">
                              {areas.find((area) => area.id === account.areaId)?.name ?? '—'}
                            </td>
                            <td className="management-actions-cell" data-label="Actions">
                              {renderPendingActions(account)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="management-cards">
                    {pendingAccounts.map((account) => (
                      <article className="management-card" key={account.id}>
                        <div className="management-card-heading">
                          <h2>{formatPersonName(account.name)}</h2>
                        </div>
                        <dl>
                          <div className="management-card-detail">
                            <dt>Email</dt>
                            <dd>{account.email}</dd>
                          </div>
                          <div className="management-card-detail">
                            <dt>Area</dt>
                            <dd>{areas.find((area) => area.id === account.areaId)?.name ?? '—'}</dd>
                          </div>
                        </dl>
                        {renderPendingActions(account)}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            ) : rows.length === 0 ? (
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
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS[activeTab].map(({ key, label }) => (
                      <td key={key} data-label={label}>
                        {activeTab === 'Managers' && key === 'area' ? (
                          <select
                            className="management-area-select"
                            aria-label={`Area for ${formatManagementName(row.name, activeTab)}`}
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
                          aria-label={`Assign ICs to ${formatManagementName(row.name, activeTab)}`}
                          title="Assign ICs"
                          onClick={() => openAssignDialog(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-solid fa-user-plus" aria-hidden="true" />
                        </button>
                      )}
                      {activeTab === 'Managers' && (
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`View feedback for ${formatManagementName(row.name, activeTab)}`}
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
                        aria-label={`Edit ${formatManagementName(row.name, activeTab)}`}
                        onClick={() => openEditDialog(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Delete ${formatManagementName(row.name, activeTab)}`}
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
          <div className="management-cards" ref={viewContainerRef}>
            {visibleRows.map((row) => (
              <article className="management-card" key={row.id}>
                <div className="management-card-heading">
                  <h2>{formatManagementName(row.name, activeTab)}</h2>
                  <div className="management-card-actions">
                    {activeTab === 'Managers' && (
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Assign ICs to ${formatManagementName(row.name, activeTab)}`}
                        title="Assign ICs"
                        onClick={() => openAssignDialog(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-solid fa-user-plus" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="management-row-action"
                      aria-label={`Edit ${formatManagementName(row.name, activeTab)}`}
                      onClick={() => openEditDialog(row)}
                      disabled={isMutating}
                    >
                      <i className="fa-solid fa-pen" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="management-row-action"
                      aria-label={`Delete ${formatManagementName(row.name, activeTab)}`}
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
            {!showPendingRequests && rows.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '16px 0 20px 0' }}>
                <button
                  type="button"
                  className="btn btn-icon btn-secondary"
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1 || isMutating}
                  aria-label="Previous page"
                  style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  {arrowBack}
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-icon btn-secondary"
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages || isMutating}
                  aria-label="Next page"
                  style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', color: 'var(--text)', background: 'var(--surface)' }}
                >
                  {arrowForward}
                </button>
              </div>
            )}
          </>
        )}
        {feedbackManager && (
          <div
            className={`management-dialog-backdrop${closingPopup === 'feedback' ? ' is-closing' : ''}`}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeFeedbackDialog();
            }}
            >
            <section
              className="management-dialog management-feedback-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="manager-feedback-title"
            >
              <h2 id="manager-feedback-title">{formatPersonName(feedbackManager.name)} — Feedback</h2>
              {feedbackManager.feedbackEntries?.length ? (
                <div className="management-feedback-list">
                  {feedbackManager.feedbackEntries.map((entry) => (
                    <article className="management-feedback-entry" key={entry.id}>
                      <div className="management-feedback-entry-heading">
                        <strong>{formatPersonName(entry.icName)}</strong>
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
                  onClick={closeFeedbackDialog}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )}
        {assigningManager && (
          <div
            className="management-dialog-backdrop management-assignment-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAssignDialog();
            }}
          >
            <section
              className="management-dialog management-assignment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="manager-assignment-title"
            >
              <h2 id="manager-assignment-title">Assign ICs to {formatPersonName(assigningManager.name)}</h2>
              <input
                type="search"
                className="management-assignment-search"
                aria-label="Search ICs"
                placeholder="Select ICs to assign."
                value={icSearch}
                onChange={(event) => setICSearch(event.target.value)}
              />
              {individualContributors.length === 0 ? (
                <p className="management-empty-state">There are no ICs to assign.</p>
              ) : filteredICs.length === 0 ? (
                <p className="management-empty-state">No ICs match your search.</p>
              ) : (
                <div className="management-assignment-list">
                  {filteredICs.map((ic) => {
                    const isAssignedToManager = ic.managerId === assigningManager.id;
                    const isSelected = isAssignedToManager || selectedICIds.includes(ic.id);
                    return (
                      <button
                        type="button"
                        className={`management-assignment-option${isSelected ? ' is-selected' : ''}`}
                        key={ic.id}
                        aria-pressed={isSelected}
                        disabled={isMutating || isAssignedToManager}
                        onClick={() => {
                          setSelectedICIds((current) =>
                            current.includes(ic.id)
                              ? current.filter((id) => id !== ic.id)
                              : [...current, ic.id]
                          );
                        }}
                      >
                        <span className="management-assignment-option-info">
                          <strong>{formatPersonName(ic.name)}</strong>
                          <small>{ic.title}</small>
                        </span>
                        <span className="management-assignment-status">
                          {isAssignedToManager
                            ? 'Assigned'
                            : isSelected
                              ? 'Selected'
                              : ic.managerName
                                ? `Move from ${formatPersonName(ic.managerName)}`
                                : 'Assign'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {error && <p className="management-error" role="alert">{error}</p>}
              <div className="management-dialog-actions">
                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={closeAssignDialog}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="management-add-button"
                  onClick={() => void assignSelectedICs()}
                  disabled={isMutating || selectedICIds.length === 0}
                >
                  {isMutating ? 'Assigning...' : 'Assign ICs'}
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {isDialogOpen && (
        <div
          className={`management-dialog-backdrop${closingPopup === 'form' ? ' is-closing' : ''}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isMutating) closeDialog();
          }}
        >
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
                    <option key={manager.id} value={manager.id}>{formatPersonName(manager.name)}</option>
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
