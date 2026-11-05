import { API_URL } from './api';

export type ManagementTab = 'Areas' | 'Managers' | 'ICs' | 'Projects';

export interface ManagementRow {
  id: number;
  name: string;
  managers?: number;
  ics?: number;
  averageScore?: number;
  area?: string;
  manager?: string;
  entries?: number;
  email?: string;
  areaId?: number;
  managerId?: number;
  title?: string;
  feedbackEntries?: ManagerFeedback[];
}

export interface ManagerFeedback {
  id: number;
  icName: string;
  projectName: string;
  date: string;
  score: number;
  comment: string | null;
}

export interface ManagementData {
  rows: ManagementRow[];
  areas: Array<{ id: number; name: string }>;
  managers: Array<{ id: number; name: string }>;
}

export interface ManagementFormValues {
  name: string;
  email: string;
  password: string;
  areaId: string;
  title: string;
  managerId: string;
  entries: string;
}

interface APIUser {
  id: number;
  name: string;
  email: string;
  role: string;
  area_id: number | null;
}

interface APIArea {
  id: number;
  name: string;
}

interface APIC {
  IC_id: number;
  name: string;
  title: string;
  manager_id: number;
  entries: number;
}

interface APIProject {
  id: number;
  name: string;
}

interface APIFeedback {
  id: number;
  ic_id: number;
  project_id: number;
  date: string;
  score: number;
  comment: string | null;
}

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
      ? payload as { message?: string; error?: string }
      : undefined;
    throw new Error(body?.message ?? body?.error ?? `Request failed (${response.status}).`);
  }

  return payload as T;
}

async function getList<T>(path: string, token: string): Promise<T[]> {
  const result = await request<ListResponse<T>>(path, token);
  if (!Array.isArray(result.data)) throw new Error(`Invalid list response from ${path}.`);
  return result.data;
}

async function getAllPages<T>(path: string, token: string): Promise<T[]> {
  const firstPage = await request<ListResponse<T>>(`${path}?page=1&limit=100`, token);
  if (!Array.isArray(firstPage.data) || !Number.isInteger(firstPage.pagination?.totalPages)) {
    throw new Error(`Invalid paginated response from ${path}.`);
  }

  const pages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
      request<ListResponse<T>>(`${path}?page=${index + 2}&limit=100`, token)
    )
  );
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
    const [areas, managers, ics, feedback] = await Promise.all([
      getList<APIArea>('/areas', token),
      getList<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
      getAllPages<APIFeedback>('/feedback', token),
    ]);
    const managersById = new Map(managers.map((manager) => [manager.id, manager]));
    const areaByICId = new Map<number, number>();
    const icsByArea = new Map<number, number>();
    const scoresByArea = new Map<number, number[]>();

    for (const ic of ics) {
      const areaId = managersById.get(ic.manager_id)?.area_id;
      if (areaId === null || areaId === undefined) continue;
      areaByICId.set(ic.IC_id, areaId);
      icsByArea.set(areaId, (icsByArea.get(areaId) ?? 0) + 1);
    }
    for (const feedbackItem of feedback) {
      const areaId = areaByICId.get(feedbackItem.ic_id);
      if (areaId === undefined) continue;
      const scores = scoresByArea.get(areaId) ?? [];
      scores.push(feedbackItem.score);
      scoresByArea.set(areaId, scores);
    }

    return {
      rows: areas.map((area) => {
        const areaManagers = managers.filter((manager) => manager.area_id === area.id);
        const scores = scoresByArea.get(area.id) ?? [];
        return {
          id: area.id,
          name: area.name,
          managers: areaManagers.length,
          ics: icsByArea.get(area.id) ?? 0,
          averageScore: scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : undefined,
        };
      }),
      areas,
      managers: managers.map(({ id, name }) => ({ id, name })),
    };
  }

  if (tab === 'Managers') {
    const [areas, managers, ics, feedback, projects] = await Promise.all([
      getList<APIArea>('/areas', token),
      getList<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
      getAllPages<APIFeedback>('/feedback', token),
      getList<APIProject>('/projects', token),
    ]);
    const areasById = new Map(areas.map((area) => [area.id, area.name]));
    const projectsById = new Map(projects.map((project) => [project.id, project.name]));
    const icsById = new Map(ics.map((ic) => [ic.IC_id, ic]));
    const icCountsByManager = new Map<number, number>();
    const managerScores = new Map<number, number[]>();
    const managerFeedback = new Map<number, ManagerFeedback[]>();

    for (const ic of ics) {
      icCountsByManager.set(ic.manager_id, (icCountsByManager.get(ic.manager_id) ?? 0) + 1);
    }

    for (const item of feedback) {
      const ic = icsById.get(item.ic_id);
      if (!ic) continue;

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
    };
  }

  if (tab === 'ICs') {
    const [areas, managers, ics] = await Promise.all([
      getList<APIArea>('/areas', token),
      getList<APIUser>(withQuery('/users', 'role=manager'), token),
      getAllPages<APIC>('/ics', token),
    ]);
    const areasById = new Map(areas.map((area) => [area.id, area.name]));
    const managersById = new Map(managers.map((manager) => [manager.id, manager]));

    return {
      rows: ics.map((ic) => {
        const manager = managersById.get(ic.manager_id);
        return {
          id: ic.IC_id,
          name: ic.name,
          title: ic.title,
          managerId: ic.manager_id,
          manager: manager?.name ?? `Manager ${ic.manager_id}`,
          area: manager?.area_id === null || manager?.area_id === undefined
            ? 'No area assigned'
            : areasById.get(manager.area_id) ?? `Area ${manager.area_id}`,
          entries: ic.entries,
        };
      }),
      areas,
      managers: managers.map(({ id, name }) => ({ id, name })),
    };
  }

  const [projects, feedback] = await Promise.all([
    getList<APIProject>('/projects', token),
    getAllPages<APIFeedback>('/feedback', token),
  ]);
  return {
    rows: projects.map((project) => ({
      id: project.id,
      name: project.name,
      entries: feedback.filter((item) => item.project_id === project.id).length,
    })),
    areas: [],
    managers: [],
  };
}

export async function saveManagementRow(
  tab: ManagementTab,
  id: number | null,
  values: ManagementFormValues,
  token: string
): Promise<void> {
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

export async function deleteManagementRow(
  tab: ManagementTab,
  id: number,
  token: string
): Promise<void> {
  const path = tab === 'Areas'
    ? '/areas'
    : tab === 'Managers'
      ? '/users'
      : tab === 'ICs'
        ? '/ics'
        : '/projects';
  await request(`${path}/${id}`, token, { method: 'DELETE' });
}
