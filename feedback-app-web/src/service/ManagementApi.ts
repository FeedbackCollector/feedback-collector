import { ManagementTab, ManagementData, ManagerFeedback, ManagementFormValues, APIFeedback, APIArea, APIUser, APIC, APIProject } from '../types/managementTypes';
import { API_URL } from './api';

interface ListResponse<T> {
  data?: T[];
  pagination?: {
    totalPages?: number;
  };
}

async function request<T>(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const text = await response.text();
  let payload: unknown;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const body = payload && typeof payload === 'object'
      ? payload as {
          message?: string;
          error?: string;
          errors?: Array<{ field?: string; message?: string }>;
        }
      : undefined;
    const validationErrors = body?.errors
      ?.map(({ field, message }) => [field, message].filter(Boolean).join(': '))
      .filter(Boolean);
    const message = validationErrors?.length
      ? `${body?.message ?? body?.error ?? 'Request failed.'} ${validationErrors.join('; ')}`
      : body?.message ?? body?.error ?? `Request failed (${response.status}).`;
    throw new Error(message);
  }

  return payload as T;
}

async function getList<T>(path: string, token: string): Promise<T[]> {
  const result = await request<ListResponse<T>>(path, token);
  if (!Array.isArray(result.data)) throw new Error(`Invalid list response from ${path}.`);
  return result.data;
}

async function getAllPages<T>(path: string, token: string): Promise<T[]> {
  const separator = path.includes('?') ? '&' : '?';
  const firstPage = await request<ListResponse<T>>(`${path}${separator}page=1&limit=100`, token);
  const totalPages = firstPage.pagination?.totalPages;

  if (
    !Array.isArray(firstPage.data) ||
    typeof totalPages !== 'number' ||
    !Number.isInteger(totalPages)
  ) {
    throw new Error(`Invalid paginated response from ${path}.`);
  }

  const pages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      request<ListResponse<T>>(`${path}${separator}page=${index + 2}&limit=100`, token)
    )
  )

  if (pages.some((page) => !Array.isArray(page.data))) {
    throw new Error(`Invalid paginated response from ${path}.`);
  }

  return [...firstPage.data, ...pages.flatMap((page) => page.data ?? [])];
}

function withQuery(path: string, query: string): string {
  return `${path}?${query}`;
}

export async function loadManagementData(
  tab: ManagementTab,
  token: string
): Promise<ManagementData> {
  if (tab === 'Areas') {
    const [areas, managerAccounts, ics] = await Promise.all([
      getList<APIArea>('/areas', token),
      getAllPages<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
    ]);
    const managers = managerAccounts.filter((manager) => manager.status !== 'pending');
    const managersById = new Map(managers.map((manager) => [manager.id, manager]));
    const icsByArea = new Map<number, number>();
    const scoreTotalsByArea = new Map<number, { weighted: number; entries: number }>();

    for (const ic of ics) {
      const areaId = ic.area_id ?? (ic.manager_id === null ? undefined : managersById.get(ic.manager_id)?.area_id);
      if (areaId === null || areaId === undefined) continue;
      icsByArea.set(areaId, (icsByArea.get(areaId) ?? 0) + 1);
      if (typeof ic.score === 'number' && ic.entries > 0) {
        const totals = scoreTotalsByArea.get(areaId) ?? { weighted: 0, entries: 0 };
        totals.weighted += ic.score * ic.entries;
        totals.entries += ic.entries;
        scoreTotalsByArea.set(areaId, totals);
      }
    }

    return {
      rows: areas.map((area) => {
        const areaManagers = managers.filter((manager) => manager.area_id === area.id);
        const totals = scoreTotalsByArea.get(area.id);
        return {
          id: area.id,
          name: area.name,
          managers: areaManagers.length,
          ics: icsByArea.get(area.id) ?? 0,
          averageScore: totals ? totals.weighted / totals.entries : undefined,
        };
      }),
      areas,
      managers: managers.map(({ id, name }) => ({ id, name })),
      pendingAccounts: [],
    };
  }

  if (tab === 'Managers') {
    const [areas, managerAccounts, ics, feedback, projects] = await Promise.all([
      getList<APIArea>('/areas', token),
      getAllPages<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
      getAllPages<APIFeedback>('/feedback', token),
      getList<APIProject>('/projects', token),
    ]);
    const managers = managerAccounts.filter((manager) => manager.status !== 'pending');
    const pendingAccounts = managerAccounts
      .filter((manager) => manager.status === 'pending')
      .map((manager) => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        areaId: manager.area_id,
      }));
    const managersById = new Map(managers.map((manager) => [manager.id, manager]));
    const areasById = new Map(areas.map((area) => [area.id, area.name]));
    const projectsById = new Map(projects.map((project) => [project.id, project.name]));
    const icsById = new Map(ics.map((ic) => [ic.IC_id, ic]));
    const icCountsByManager = new Map<number, number>();
    const managerScores = new Map<number, number[]>();
    const managerFeedback = new Map<number, ManagerFeedback[]>();

    for (const ic of ics) {
      if (ic.manager_id === null) continue;
      icCountsByManager.set(ic.manager_id, (icCountsByManager.get(ic.manager_id) ?? 0) + 1);
    }

    for (const item of feedback) {
      const ic = icsById.get(item.ic_id);
      if (!ic || ic.manager_id === null) continue;

      const scores = managerScores.get(ic.manager_id) ?? [];
      scores.push(item.score);
      managerScores.set(ic.manager_id, scores);

      const entries = managerFeedback.get(ic.manager_id) ?? [];
      entries.push({
        id: item.id,
        icName: ic.name,
        projectName: projectsById.get(item.project_id) ?? `Project ${item.project_id}`,
        date: item.date,
        score: item.score,
        comment: item.comment,
      });
      managerFeedback.set(ic.manager_id, entries);
    }

    return {
      rows: managers.map((manager) => {
        const scores = managerScores.get(manager.id) ?? [];
        return {
          id: manager.id,
          name: manager.name,
          email: manager.email,
          areaId: manager.area_id ?? undefined,
          area: manager.area_id === null ? 'No area assigned' : areasById.get(manager.area_id) ?? `Area ${manager.area_id}`,
          ics: icCountsByManager.get(manager.id) ?? 0,
          averageScore: scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : undefined,
          feedbackEntries: managerFeedback.get(manager.id) ?? [],
        };
      }),
      areas,
      managers: managers.map(({ id, name }) => ({ id, name })),
      pendingAccounts,
      individualContributors: ics.map((ic) => ({
        id: ic.IC_id,
        name: ic.name,
        title: ic.title,
        managerId: ic.manager_id,
        managerName: ic.manager_id === null ? null : managersById.get(ic.manager_id)?.name ?? `Manager ${ic.manager_id}`,
        directorId: ic.director_id,
      })),
    };
  }

  if (tab === 'ICs') {
    const [areas, managerAccounts, ics] = await Promise.all([
      getList<APIArea>('/areas', token),
      getAllPages<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
    ]);
    const managers = managerAccounts.filter((manager) => manager.status !== 'pending');
    const areasById = new Map(areas.map((area) => [area.id, area.name]));
    const managersById = new Map(managers.map((manager) => [manager.id, manager]));

    return {
      rows: ics.map((ic) => {
        const manager = ic.manager_id === null ? undefined : managersById.get(ic.manager_id);
        return {
          id: ic.IC_id,
          name: ic.name,
          title: ic.title,
          managerId: ic.manager_id,
          manager: manager?.name ?? (ic.director_id === null ? 'Unassigned' : 'Director-held'),
          area: manager?.area_id === null || manager?.area_id === undefined
            ? 'No area assigned'
            : areasById.get(manager.area_id) ?? `Area ${manager.area_id}`,
          entries: ic.entries,
        };
      }),
      areas,
      managers: managers.map(({ id, name }) => ({ id, name })),
      pendingAccounts: [],
    };
  }

  if (tab === 'Directors') {
    const [directorAccounts, managerAccounts, ics] = await Promise.all([
      getAllPages<APIUser>(withQuery('/users', 'role=director'), token),
      getAllPages<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
    ]);
    const directors = directorAccounts.filter((director) => director.status !== 'pending');
    const managers = managerAccounts.filter((manager) => manager.status !== 'pending');
    const icsByManager = new Map<number, number>();
    const icsByDirector = new Map<number, number>();
    for (const ic of ics) {
      if (ic.manager_id !== null) {
        icsByManager.set(ic.manager_id, (icsByManager.get(ic.manager_id) ?? 0) + 1);
      } else if (ic.director_id !== null) {
        icsByDirector.set(ic.director_id, (icsByDirector.get(ic.director_id) ?? 0) + 1);
      }
    }

    const managersByDirector = new Map<number, APIUser[]>();
    for (const manager of managers) {
      if (manager.director_id === null || manager.director_id === undefined) continue;
      const assignedManagers = managersByDirector.get(manager.director_id) ?? [];
      assignedManagers.push(manager);
      managersByDirector.set(manager.director_id, assignedManagers);
    }

    return {
      rows: directors.map((director) => {
        const assignedManagers = managersByDirector.get(director.id) ?? [];
        return {
          id: director.id,
          name: director.name,
          email: director.email,
          managers: assignedManagers.length,
          managerIds: assignedManagers.map((manager) => manager.id),
          ics: assignedManagers.reduce(
            (total, manager) => total + (icsByManager.get(manager.id) ?? 0),
            0
          ) + (icsByDirector.get(director.id) ?? 0),
        };
      }),
      areas: [],
      managers: managers.map(({ id, name, email, director_id }) => ({
        id,
        name,
        email,
        directorId: director_id,
      })),
      pendingAccounts: [],
      individualContributors: ics.map((ic) => ({
        id: ic.IC_id,
        name: ic.name,
        title: ic.title,
        managerId: ic.manager_id,
        managerName: ic.manager_id === null
          ? null
          : managers.find((manager) => manager.id === ic.manager_id)?.name ?? `Manager ${ic.manager_id}`,
        directorId: ic.director_id,
      })),
    };
  }

  const [projects, feedback, managerAccounts] = await Promise.all([
    getList<APIProject>('/projects', token),
    getAllPages<APIFeedback>('/feedback', token),
    getAllPages<APIUser>(withQuery('/users', 'role=manager'), token),
  ]);
  const managers = managerAccounts.filter((manager) => manager.status !== 'pending');
  const managersById = new Map(managers.map((manager) => [manager.id, manager.name]));
  return {
    rows: projects.map((project) => {
      const managerIds = project.manager_ids ?? [];
      return {
        id: project.id,
        name: project.name,
        entries: feedback.filter((item) => item.project_id === project.id).length,
        managerIds,
        managerNames: managerIds
          .map((managerId) => managersById.get(managerId))
          .filter((name): name is string => name !== undefined)
          .join(', ') || 'None assigned',
      };
    }),
    areas: [],
    managers: managers.map(({ id, name }) => ({ id, name })),
    pendingAccounts: [],
  };
}

export async function saveManagementRow(
  tab: ManagementTab,
  id: number | null,
  values: ManagementFormValues,
  token: string
): Promise<void> {
  if (tab === 'Directors') {
    throw new Error('Director assignments cannot be changed here.');
  }

  const method = id === null ? 'POST' : 'PATCH';
  const path = tab === 'Areas'
    ? '/areas'
    : tab === 'Managers'
      ? '/users'
      : tab === 'ICs'
        ? '/ics'
        : '/projects';
  const endpoint = id === null ? path : `${path}/${id}`;
  let body: Record<string, string | number>;

  if (tab === 'Areas' || tab === 'Projects') {
    body = { name: values.name.trim() };
  } else if (tab === 'Managers') {
    body = {
      name: values.name.trim(),
      email: values.email.trim(),
      area_id: Number(values.areaId),
    };
    if (id === null) {
      body.password = values.password;
      body.role = 'manager';
    }
  } else {
    body = {
      name: values.name.trim(),
      title: values.title.trim(),
      manager_id: Number(values.managerId),
      entries: Number(values.entries),
    };
  }

  await request(endpoint, token, {
    method,
    body: JSON.stringify(body),
  });
}

export async function updateManagerArea(
  id: number,
  areaId: number,
  token: string
): Promise<void> {
  await request(`/users/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ area_id: areaId }),
  });
}

export async function updateManagerDirector(
  managerId: number,
  directorId: number | null,
  token: string
): Promise<void> {
  await request(`/users/${managerId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ director_id: directorId }),
  });
}

export async function updateICManager(
  icId: number,
  managerId: number,
  token: string
): Promise<void> {
  await request(`/ics/${icId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ manager_id: managerId }),
  });
}

export async function updateProjectManagers(
  projectId: number,
  managerIds: number[],
  token: string
): Promise<void> {
  await request(`/projects/${projectId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ manager_ids: managerIds }),
  });
}

export async function approvePendingAccount(id: number, token: string): Promise<void> {
  await request(`/users/${id}/approve`, token, { method: 'PATCH' });
}

export interface PreApprovedEmail {
  email: string;
  created_at: string;
}

export async function listPreApprovedEmails(token: string): Promise<PreApprovedEmail[]> {
  const result = await request<{ data: PreApprovedEmail[] }>('/pre-approvals', token);
  return result.data;
}

export async function addPreApprovedEmail(email: string, token: string): Promise<void> {
  await request('/pre-approvals', token, {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function removePreApprovedEmail(email: string, token: string): Promise<void> {
  await request(`/pre-approvals/${encodeURIComponent(email)}`, token, { method: 'DELETE' });
}

export async function deleteManagementRow(
  tab: ManagementTab,
  id: number,
  token: string
): Promise<void> {
  if (tab === 'Directors') {
    throw new Error('Directors cannot be deleted from Management.');
  }

  const path = tab === 'Areas'
    ? '/areas'
    : tab === 'Managers'
      ? '/users'
      : tab === 'ICs'
        ? '/ics'
        : '/projects';
  await request(`${path}/${id}`, token, { method: 'DELETE' });
}
