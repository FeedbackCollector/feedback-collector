import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  approvePendingAccount,
  deleteManagementRow,
  loadManagementData,
  saveManagementRow,
  updateManagerArea,
  updateManagerDirector,
  updateICManager,
  updateProjectManagers,
} from '../service/ManagementApi';
import type {
  ManagementData,
  ManagementFormValues,
  PendingAccount,
  ManagementRow,
  ManagementTab,
} from '../types/managementTypes';
import { useAuthStore, type User } from '../store/authStore';
import { normalizeSearchText } from '../utils/search';
import '../styles/Management.css';
import {useToastStore} from '../store/toastStore';
import PreApprovedEmails from './PreApprovedEmails';
import LoadingOverlay from './LoadingOverlay';
import { formatPersonName } from './formatPersonName';
import DropdownSelect from './DropdownSelect';
import AutocompleteSearch from './AutocompleteSearch';

type ViewMode = 'table' | 'cards';

const TABS: ManagementTab[] = ['Areas', 'Managers', 'ICs', 'Projects', 'Directors'];

function formatManagementName(name: string, tab: ManagementTab): string {
  return tab === 'Managers' || tab === 'ICs' ? formatPersonName(name) : name;
}

function shouldCenterColumn(tab: ManagementTab, key: keyof ManagementRow): boolean {
  return (
    (tab === 'Areas' && (key === 'managers' || key === 'averageScore')) ||
    (tab === 'Managers' && key === 'averageScore') ||
    (tab === 'Projects' && key === 'entries')
  );
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
    { label: 'Managers', key: 'managerNames' },
  ],
  Directors: [
    { label: 'Name', key: 'name' },
    { label: 'Email', key: 'email' },
    { label: 'Managers', key: 'managers' },
    { label: 'ICs', key: 'ics' },
  ],
};

const TAB_SINGULAR: Record<ManagementTab, string> = {
  Areas: 'Area',
  Managers: 'Manager',
  ICs: 'IC',
  Projects: 'Project',
  Directors: 'Director',
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

function getRowsForTab(data: ManagementData, tab: ManagementTab, user: User | null): ManagementRow[] {
  if (tab !== 'Directors') return data.rows;

  if (
    user?.role.toLowerCase() !== 'director' ||
    user.id === undefined ||
    data.rows.some((row) => row.id === user.id)
  ) {
    return data.rows;
  }

  const assignedManagers = data.managers.filter((manager) => manager.directorId === user.id);
  const managerIds = new Set(assignedManagers.map((manager) => manager.id));
  const assignedICs = data.individualContributors?.filter(
    (ic) => (ic.managerId !== null && managerIds.has(ic.managerId)) || ic.directorId === user.id
  ).length ?? 0;
  return [
    ...data.rows,
    {
      id: user.id,
      name: user.name ?? user.email,
      email: user.email,
      managers: assignedManagers.length,
      managerIds: assignedManagers.map((manager) => manager.id),
      ics: assignedICs,
    },
  ];
}

type DeleteTarget = {
  id: number;
  name: string;
  kind: string;
  tab: ManagementTab;
  isPendingRequest: boolean;
};

type ManagementCompProps = {
  activeTab: ManagementTab;
  onTabChange: (tab: ManagementTab) => void;
};

function ManagementComp({ activeTab, onTabChange }: ManagementCompProps) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
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
  const [assigningProject, setAssigningProject] = useState<ManagementRow | null>(null);
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [assigningDirector, setAssigningDirector] = useState<ManagementRow | null>(null);
  const [selectedDirectorManagerIds, setSelectedDirectorManagerIds] = useState<number[]>([]);
  const [directorManagerSearch, setDirectorManagerSearch] = useState('');
  const [directorAssignmentError, setDirectorAssignmentError] = useState<string | null>(null);
  const [assigningDirectorICs, setAssigningDirectorICs] = useState<ManagementRow | null>(null);
  const [selectedDirectorICIds, setSelectedDirectorICIds] = useState<number[]>([]);
  const [directorICManagerId, setDirectorICManagerId] = useState('');
  const [directorICManagerSearch, setDirectorICManagerSearch] = useState('');
  const [directorICAssignmentError, setDirectorICAssignmentError] = useState<string | null>(null);
  const [feedbackManager, setFeedbackManager] = useState<ManagementRow | null>(null);
  const [formValues, setFormValues] = useState<ManagementFormValues>(EMPTY_FORM);
  const [closingPopup, setClosingPopup] = useState<'feedback' | 'form' | 'delete' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);


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
          setRows(getRowsForTab(data, activeTab, user));
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
  }, [activeTab, token, user]);

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
    }, 150);
  };

  const closeFeedbackDialog = () => {
  if (closingPopup) return;

    setClosingPopup('feedback');
    window.setTimeout(() => {
      setFeedbackManager(null);
      setClosingPopup(null);
    }, 150);
  };

  const updateFormValue = (key: keyof ManagementFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const refreshRows = async () => {
    if (!token) throw new Error('You must be logged in to load management data.');
    const data = await loadManagementData(activeTab, token);
    setRows(getRowsForTab(data, activeTab, user));
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


  const requestDeleteRow = (row: ManagementRow) => {
    setError(null);
    setClosingPopup(null);
    setDeleteTarget({
      id: row.id,
      name: row.name,
      kind: TAB_SINGULAR[activeTab],
      tab: activeTab,
      isPendingRequest: false,
    });
  };

  const closeDeleteDialog = () => {
    if (closingPopup || isMutating) return;

    setClosingPopup('delete');
    window.setTimeout(() => {
      setDeleteTarget(null);
      setError(null);
      setClosingPopup(null);
    }, 75);
  };

  const confirmDelete = async () => {
    if (!token || !deleteTarget) return;

    setIsMutating(true);
    setError(null);
    try {
      await deleteManagementRow(deleteTarget.tab, deleteTarget.id, token);
      await refreshRows();
      setDeleteTarget(null);
      if (!deleteTarget.isPendingRequest) {
        useToastStore.getState().addToast(`${deleteTarget.kind} deleted successfully!`, 'success');
      }
    } catch (reason: unknown) {
      console.error(`Could not delete ${deleteTarget.kind.toLowerCase()}:`, reason);
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
    if (!token) return;

    setError(null);
    setClosingPopup(null);
    setDeleteTarget({
      id: account.id,
      name: account.name,
      kind: 'Account request',
      tab: 'Managers',
      isPendingRequest: true,
    });
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
        onClick={() => deletePendingAccount(account)}
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

  const openDirectorManagerDialog = (director: ManagementRow) => {
    setAssigningDirector(director);
    setSelectedDirectorManagerIds(
      managers
        .filter((manager) => manager.directorId === director.id)
        .map((manager) => manager.id)
    );
    setDirectorManagerSearch('');
    setDirectorAssignmentError(null);
  };

  const closeDirectorManagerDialog = () => {
    if (isMutating) return;
    setAssigningDirector(null);
    setSelectedDirectorManagerIds([]);
    setDirectorManagerSearch('');
    setDirectorAssignmentError(null);
  };

  const assignManagersToDirector = async () => {
    if (!token || !assigningDirector) return;

    const selectedIds = new Set(selectedDirectorManagerIds);
    const changedManagers = managers.filter((manager) =>
      selectedIds.has(manager.id)
        ? manager.directorId !== assigningDirector.id
        : manager.directorId === assigningDirector.id
    );
    if (changedManagers.length === 0) return;

    setIsMutating(true);
    setDirectorAssignmentError(null);
    try {
      const results = await Promise.allSettled(
        changedManagers.map((manager) =>
          updateManagerDirector(
            manager.id,
            selectedIds.has(manager.id) ? assigningDirector.id : null,
            token
          )
        )
      );
      await refreshRows();

      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        const firstFailure = failures[0];
        setDirectorAssignmentError(
          firstFailure.status === 'rejected'
            ? `Could not update ${failures.length} manager assignment${failures.length === 1 ? '' : 's'}: ${getErrorMessage(firstFailure.reason)}`
            : 'Could not update manager assignments.'
        );
        return;
      }

      setAssigningDirector(null);
      setSelectedDirectorManagerIds([]);
      setDirectorManagerSearch('');
      setDirectorAssignmentError(null);
      useToastStore.getState().addToast('Manager assignments updated successfully!', 'success');
    } catch (reason: unknown) {
      console.error('Could not update director manager assignments:', reason);
      setDirectorAssignmentError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const openDirectorICDialog = (director: ManagementRow) => {
    setAssigningDirectorICs(director);
    setSelectedDirectorICIds([]);
    setDirectorICManagerId('');
    setDirectorICManagerSearch('');
    setDirectorICAssignmentError(null);
  };

  const closeDirectorICDialog = () => {
    if (isMutating) return;
    setAssigningDirectorICs(null);
    setSelectedDirectorICIds([]);
    setDirectorICManagerId('');
    setDirectorICManagerSearch('');
    setDirectorICAssignmentError(null);
  };

  const assignDirectorICs = async () => {
    if (!token || !assigningDirectorICs || selectedDirectorICIds.length === 0 || !directorICManagerId) return;

    setIsMutating(true);
    setDirectorICAssignmentError(null);
    try {
      const results = await Promise.allSettled(
        selectedDirectorICIds.map((icId) => updateICManager(icId, Number(directorICManagerId), token))
      );
      await refreshRows();

      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        const firstFailure = failures[0];
        setDirectorICAssignmentError(
          firstFailure.status === 'rejected'
            ? `Could not assign ${failures.length} IC${failures.length === 1 ? '' : 's'}: ${getErrorMessage(firstFailure.reason)}`
            : 'Could not assign ICs.'
        );
        return;
      }

      setAssigningDirectorICs(null);
      setSelectedDirectorICIds([]);
      setDirectorICManagerId('');
      setDirectorICManagerSearch('');
    } catch (reason: unknown) {
      console.error('Could not assign Director-held ICs:', reason);
      setDirectorICAssignmentError(getErrorMessage(reason));
    } finally {
      setIsMutating(false);
    }
  };

  const openAssignProjectDialog = (project: ManagementRow) => {
    setAssigningProject(project);
    setSelectedManagerIds(project.managerIds ?? []);
    setManagerSearch('');
    setError(null);
  };

  const closeAssignProjectDialog = () => {
    if (isMutating) return;
    setAssigningProject(null);
    setSelectedManagerIds([]);
    setManagerSearch('');
    setError(null);
  };

  const assignManagersToProject = async () => {
    if (!token || !assigningProject) return;

    setIsMutating(true);
    setError(null);
    try {
      await updateProjectManagers(assigningProject.id, selectedManagerIds, token);
      await refreshRows();
      setAssigningProject(null);
      setSelectedManagerIds([]);
      setManagerSearch('');
    } catch (reason: unknown) {
      console.error('Could not assign managers to project:', reason);
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
  const normalizedManagerSearch = normalizeSearchText(managerSearch.trim());
  const filteredManagers = managers.filter((manager) =>
    normalizeSearchText(manager.name).includes(normalizedManagerSearch)
  );
  const normalizedDirectorManagerSearch = normalizeSearchText(directorManagerSearch.trim());
  const filteredDirectorManagers = managers.filter((manager) =>
    normalizeSearchText(`${manager.name} ${manager.email ?? ''}`).includes(normalizedDirectorManagerSearch)
  );
  const selectedDirectorManagerSet = new Set(selectedDirectorManagerIds);
  const directorHeldICs = assigningDirectorICs
    ? individualContributors.filter(
      (ic) => ic.managerId === null && ic.directorId === assigningDirectorICs.id
    )
    : [];
  const directorManagers = assigningDirectorICs
    ? managers.filter((manager) => manager.directorId === assigningDirectorICs.id)
    : [];
  const directorManagerAssignmentsChanged = assigningDirector !== null && managers.some((manager) =>
    selectedDirectorManagerSet.has(manager.id)
      ? manager.directorId !== assigningDirector.id
      : manager.directorId === assigningDirector.id
  );
  const projectManagersChanged = assigningProject !== null && (
    (assigningProject.managerIds ?? []).length !== selectedManagerIds.length ||
    (assigningProject.managerIds ?? []).some((id) => !selectedManagerIds.includes(id))
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

          <div className="management-view-toggle" role="group" aria-label="Management view">
            {activeTab !== 'Managers' && activeTab !== 'Directors' && (
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
            <div className="management-view-toggle-buttons">
                <button
                  type="button"
                  className={`management-view-button${viewMode === 'table' ? ' is-active' : ''}`}
                  aria-label="Table view"
                  aria-pressed={viewMode === 'table'}
                  onClick={() => changeViewMode('table')}
                >
                  <svg aria-hidden="true" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor">
                    <path d="M760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120ZM200-640h560v-120H200v120Zm100 80H200v360h100v-360Zm360 0v360h100v-360H660Zm-80 0H380v360h200v-360Z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`management-view-button${viewMode === 'cards' ? ' is-active' : ''}`}
                  aria-label="Card view"
                  aria-pressed={viewMode === 'cards'}
                  onClick={() => changeViewMode('cards')}
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
        </div>

        {error && !isDialogOpen && !assigningManager && !deleteTarget && (
          <p className="management-error" role="alert">
            Could not complete the request: {error}
          </p>
        )}
        {loading ? (
          <LoadingOverlay message={`Loading ${activeTab.toLowerCase()}...`} />
        ) : error && !isDialogOpen && !assigningManager && !deleteTarget ? null : (
          <>
            {activeTab === 'Managers' && showPendingRequests ? (
              <section
                className="management-requests"
                id="management-pending-requests"
                aria-labelledby="management-requests-title"
              >
                <PreApprovedEmails token={token} />
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
          <div className={`management-table-wrap${activeTab === 'Managers' ? ' management-managers-table-wrap' : ''}`}>
            <table className={`management-table${activeTab === 'Managers' ? ' management-managers-table' : ''}${activeTab === 'Areas' || activeTab === 'Projects' ? ' management-scroll-table' : ''}${activeTab === 'Projects' ? ' management-projects-table' : ''}${activeTab === 'Directors' ? ' management-directors-table' : ''}`}>
              <thead>
                <tr>
                  {COLUMNS[activeTab].map(({ label, key }) => (
                    <th
                      className={shouldCenterColumn(activeTab, key) ? 'management-centered-column' : undefined}
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                  <th><span className="management-visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    {COLUMNS[activeTab].map(({ key, label }) => (
                      <td
                        className={shouldCenterColumn(activeTab, key) ? 'management-centered-column' : undefined}
                        key={key}
                        data-label={label}
                      >
                        {activeTab === 'Managers' && key === 'area' ? (
                          <DropdownSelect
                            id={`management-area-${row.id}`}
                            label={`Area for ${formatManagementName(row.name, activeTab)}`}
                            value={row.areaId === undefined ? '' : String(row.areaId)}
                            options={[
                              ...(row.areaId === undefined
                                ? [{ value: '', label: 'No area assigned' }]
                                : []),
                              ...areas.map((area) => ({
                                value: String(area.id),
                                label: area.name,
                              })),
                            ]}
                            onChange={(value) => {
                              if (value) void changeManagerArea(row, Number(value));
                            }}
                          />
                        ) : renderCell(row, key)}
                      </td>
                    ))}
                    <td className="management-actions-cell">
                      {activeTab === 'Directors' && (
                        <>
                          <button
                            type="button"
                            className="management-row-action"
                            aria-label={`Assign managers to ${formatPersonName(row.name)}`}
                            title="Assign managers"
                            onClick={() => openDirectorManagerDialog(row)}
                            disabled={isMutating}
                          >
                            <i className="fa-solid fa-user-tie" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="management-row-action"
                            aria-label={`Assign Director-held ICs to managers of ${formatPersonName(row.name)}`}
                            title="Assign ICs"
                            onClick={() => openDirectorICDialog(row)}
                            disabled={isMutating}
                          >
                            <i className="fa-solid fa-user-group" aria-hidden="true" />
                          </button>
                        </>
                      )}
                      {activeTab === 'Managers' && (
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`Assign ICs to ${formatManagementName(row.name, activeTab)}`}
                          title="Assign ICs"
                          onClick={() => openAssignDialog(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-solid fa-user-group" aria-hidden="true" />
                        </button>
                      )}
                      {activeTab === 'Projects' && (
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`Assign managers to ${row.name}`}
                          title="Assign managers"
                          onClick={() => openAssignProjectDialog(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-solid fa-user-tie" aria-hidden="true" />
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
                      {activeTab !== 'Directors' && (
                        <>
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
                            aria-label={`Delete ${row.name}`}
                            onClick={() => requestDeleteRow(row)}
                            disabled={isMutating}
                          >
                            <i className="fa-regular fa-trash-can" aria-hidden="true" />
                          </button>
                        </>
                      )}
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
                    {activeTab === 'Directors' && (
                      <>
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`Assign managers to ${formatPersonName(row.name)}`}
                          title="Assign managers"
                          onClick={() => openDirectorManagerDialog(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-solid fa-user-tie" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="management-row-action"
                          aria-label={`Assign Director-held ICs to managers of ${formatPersonName(row.name)}`}
                          title="Assign ICs"
                          onClick={() => openDirectorICDialog(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-solid fa-user-group" aria-hidden="true" />
                        </button>
                      </>
                    )}
                    {activeTab === 'Managers' && (
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Assign ICs to ${formatManagementName(row.name, activeTab)}`}
                        title="Assign ICs"
                        onClick={() => openAssignDialog(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-solid fa-user-group" aria-hidden="true" />
                      </button>
                    )}
                    {activeTab === 'Projects' && (
                      <button
                        type="button"
                        className="management-row-action"
                        aria-label={`Assign managers to ${row.name}`}
                        title="Assign managers"
                        onClick={() => openAssignProjectDialog(row)}
                        disabled={isMutating}
                      >
                        <i className="fa-solid fa-user-tie" aria-hidden="true" />
                      </button>
                    )}
                    {activeTab !== 'Directors' && (
                      <>
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
                          aria-label={`Delete ${row.name}`}
                          onClick={() => requestDeleteRow(row)}
                          disabled={isMutating}
                        >
                          <i className="fa-regular fa-trash-can" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <dl>
                  {COLUMNS[activeTab].slice(1).map(({ label, key }) => (
                    <div
                      className={`management-card-detail${activeTab === 'Directors' ? ' management-director-card-detail' : ''}`}
                      key={key}
                    >
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
        {assigningDirector && (
          <div
            className="management-dialog-backdrop management-assignment-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDirectorManagerDialog();
            }}
          >
            <section
              className="management-dialog management-assignment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="director-manager-assignment-title"
            >
              <h2 id="director-manager-assignment-title">
                Assign managers to {formatPersonName(assigningDirector.name)}
              </h2>
              <p className="management-form-hint">
                Selecting a manager moves them from their current Director. Their ICs remain assigned to that manager.
              </p>
              <input
                type="search"
                className="management-assignment-search"
                aria-label="Search managers"
                placeholder="Search managers to assign."
                value={directorManagerSearch}
                onChange={(event) => setDirectorManagerSearch(event.target.value)}
              />
              {managers.length === 0 ? (
                <p className="management-empty-state">There are no managers to assign.</p>
              ) : filteredDirectorManagers.length === 0 ? (
                <p className="management-empty-state">No managers match your search.</p>
              ) : (
                <div className="management-assignment-list">
                  {filteredDirectorManagers.map((manager) => {
                    const isSelected = selectedDirectorManagerSet.has(manager.id);
                    const assignedDirector = rows.find((row) => row.id === manager.directorId);
                    const assignmentStatus = manager.directorId === assigningDirector.id
                      ? isSelected ? 'Assigned' : 'Remove'
                      : isSelected
                        ? manager.directorId === null || manager.directorId === undefined
                          ? 'Assign'
                          : `Move from ${formatPersonName(assignedDirector?.name ?? 'another Director')}`
                        : manager.directorId === null || manager.directorId === undefined
                          ? 'Available'
                          : `Assigned to ${formatPersonName(assignedDirector?.name ?? 'another Director')}`;

                    return (
                      <button
                        type="button"
                        className={`management-assignment-option${isSelected ? ' is-selected' : ''}`}
                        key={manager.id}
                        aria-pressed={isSelected}
                        disabled={isMutating}
                        onClick={() => {
                          setSelectedDirectorManagerIds((current) =>
                            current.includes(manager.id)
                              ? current.filter((id) => id !== manager.id)
                              : [...current, manager.id]
                          );
                        }}
                      >
                        <span className="management-assignment-option-info">
                          <strong>{formatPersonName(manager.name)}</strong>
                          {manager.email && <small>{manager.email}</small>}
                        </span>
                        <span className="management-assignment-status">{assignmentStatus}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {directorAssignmentError && (
                <p className="management-error" role="alert">{directorAssignmentError}</p>
              )}
              <div className="management-dialog-actions">
                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={closeDirectorManagerDialog}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="management-add-button"
                  onClick={() => void assignManagersToDirector()}
                  disabled={isMutating || !directorManagerAssignmentsChanged}
                >
                  {isMutating ? 'Saving...' : 'Save managers'}
                </button>
              </div>
            </section>
          </div>
        )}
        {assigningDirectorICs && (
          <div
            className="management-dialog-backdrop management-assignment-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDirectorICDialog();
            }}
          >
            <section
              className="management-dialog management-assignment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="director-ic-assignment-title"
            >
              <h2 id="director-ic-assignment-title">
                Assign ICs held by {formatPersonName(assigningDirectorICs.name)}
              </h2>
              {directorManagers.length === 0 ? (
                <p className="management-empty-state">
                  Assign a manager to this Director before assigning these ICs.
                </p>
              ) : (
                <>
                  <label className="management-form-label" htmlFor="director-ic-manager">
                    Assign selected ICs to
                  </label>
                  <AutocompleteSearch
                    id="director-ic-manager"
                    className="management-assignment-search"
                    label="Choose a manager"
                    placeholder="Search or select a manager"
                    inputClassName="management-assignment-search"
                    value={directorICManagerSearch}
                    suggestions={directorManagers.map((manager) => ({
                      id: String(manager.id),
                      label: formatPersonName(manager.name),
                      value: String(manager.id),
                      searchText: manager.email ?? '',
                    }))}
                    onChange={(value) => {
                      const selectedManager = directorManagers.find(
                        (manager) => String(manager.id) === value
                      );
                      if (selectedManager) {
                        setDirectorICManagerId(String(selectedManager.id));
                        setDirectorICManagerSearch(formatPersonName(selectedManager.name));
                        return;
                      }

                      setDirectorICManagerSearch(value);
                      setDirectorICManagerId('');
                    }}
                  />
                </>
              )}
              {directorHeldICs.length === 0 ? (
                <p className="management-empty-state">There are no ICs waiting to be assigned.</p>
              ) : (
                <div className="management-assignment-list">
                  {directorHeldICs.map((ic) => {
                    const isSelected = selectedDirectorICIds.includes(ic.id);
                    return (
                      <button
                        type="button"
                        className={`management-assignment-option${isSelected ? ' is-selected' : ''}`}
                        key={ic.id}
                        aria-pressed={isSelected}
                        disabled={isMutating || directorManagers.length === 0}
                        onClick={() => {
                          setSelectedDirectorICIds((current) =>
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
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              {directorICAssignmentError && (
                <p className="management-error" role="alert">{directorICAssignmentError}</p>
              )}
              <div className="management-dialog-actions">
                <button
                  type="button"
                  className="management-cancel-button"
                  onClick={closeDirectorICDialog}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="management-add-button"
                  onClick={() => void assignDirectorICs()}
                  disabled={
                    isMutating ||
                    selectedDirectorICIds.length === 0 ||
                    !directorICManagerId ||
                    directorManagers.length === 0
                  }
                >
                  {isMutating ? 'Assigning...' : 'Assign ICs'}
                </button>
              </div>
            </section>
          </div>
        )}
        {assigningProject && (
          <div
            className="management-dialog-backdrop management-assignment-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeAssignProjectDialog();
            }}
          >
            <section
              className="management-dialog management-assignment-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="project-assignment-title"
            >
              <h2 id="project-assignment-title">Assign managers to {assigningProject.name}</h2>
              <input
                type="search"
                className="management-assignment-search"
                aria-label="Search managers"
                placeholder="Search managers to assign."
                value={managerSearch}
                onChange={(event) => setManagerSearch(event.target.value)}
              />
              {managers.length === 0 ? (
                <p className="management-empty-state">There are no managers to assign.</p>
              ) : filteredManagers.length === 0 ? (
                <p className="management-empty-state">No managers match your search.</p>
              ) : (
                <div className="management-assignment-list">
                  {filteredManagers.map((manager) => {
                    const isSelected = selectedManagerIds.includes(manager.id);
                    return (
                      <button
                        type="button"
                        className={`management-assignment-option${isSelected ? ' is-selected' : ''}`}
                        key={manager.id}
                        aria-pressed={isSelected}
                        disabled={isMutating}
                        onClick={() => {
                          setSelectedManagerIds((current) =>
                            current.includes(manager.id)
                              ? current.filter((id) => id !== manager.id)
                              : [...current, manager.id]
                          );
                        }}
                      >
                        <span className="management-assignment-option-info">
                          <strong>{formatPersonName(manager.name)}</strong>
                        </span>
                        <span className="management-assignment-status">
                          {isSelected ? 'Assigned' : 'Assign'}
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
                  onClick={closeAssignProjectDialog}
                  disabled={isMutating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="management-add-button"
                  onClick={() => void assignManagersToProject()}
                  disabled={isMutating || !projectManagersChanged}
                >
                  {isMutating ? 'Saving...' : 'Save managers'}
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
                <DropdownSelect
                  id="management-area"
                  label="Area"
                  value={formValues.areaId}
                  options={[
                    { value: '', label: 'Select an area' },
                    ...areas.map((area) => ({
                      value: String(area.id),
                      label: area.name,
                    })),
                  ]}
                  onChange={(value) => updateFormValue('areaId', value)}
                />
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
                <DropdownSelect
                  id="management-manager"
                  label="Manager"
                  value={formValues.managerId}
                  options={[
                    { value: '', label: 'Select a manager' },
                    ...managers.map((manager) => ({
                      value: String(manager.id),
                      label: formatPersonName(manager.name),
                    })),
                  ]}
                  onChange={(value) => updateFormValue('managerId', value)}
                />

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

      {deleteTarget && (
        <div
          className={`management-dialog-backdrop management-delete-backdrop${closingPopup === 'delete' ? ' is-closing' : ''}`}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteDialog();
          }}
        >
          <section
            className="management-dialog management-delete-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="management-delete-title"
            aria-describedby="management-delete-description"
          >
            <h2 id="management-delete-title">Delete {deleteTarget.kind}</h2>
            <p id="management-delete-description" className="management-delete-message">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
            </p>
            {error && <p className="management-error" role="alert">{error}</p>}
            <div className="management-dialog-actions">
              <button
                type="button"
                className="management-cancel-button"
                onClick={closeDeleteDialog}
                disabled={isMutating}
                autoFocus
              >
                Cancel
              </button>
              <button
                type="button"
                className="management-delete-button"
                onClick={() => void confirmDelete()}
                disabled={isMutating}
              >
                {isMutating ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export default ManagementComp;
