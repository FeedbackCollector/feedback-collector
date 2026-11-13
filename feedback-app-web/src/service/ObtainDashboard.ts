import { API_URL } from './api';
import { authHeaders } from './authHeaders';
import { obtainAreas, type Area } from './ObtainAreas';
import { obtainAllICs } from './ObtainICs';
import { obtainAllFeedback } from './ObtainFeedback';

export interface DashboardManager {
  id: number;
  name: string;
  area_id: number | null;
}

export interface DashboardIC {
  IC_id: number;
  name: string;
  manager_id: number;
}

interface DashboardFeedback {
  ic_id: number;
  score: number;
}

export interface DashboardData {
  areas: Area[];
  managers: DashboardManager[];
  ics: DashboardIC[];
  feedback: DashboardFeedback[];
}

export interface DashboardMetrics {
  managers: number;
  ics: number;
  entries: number;
  averageScore: number | null;
}

interface UsersResponse {
  data?: Array<{
    id: number;
    name?: string;
    full_name?: string;
    area_id: number | null;
    role: string;
  }>;
}

async function obtainManagers(): Promise<DashboardManager[]> {
  const response = await fetch(`${API_URL}/users?role=manager`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Could not load managers (${response.status}).`);
  }

  const result = (await response.json()) as UsersResponse;
  if (!Array.isArray(result.data)) {
    throw new Error('The users response has an invalid format.');
  }

  return result.data
    .filter((user) => user.role.toLowerCase() === 'manager')
    .map((user) => ({
      id: user.id,
      name: user.name ?? user.full_name ?? `Manager #${user.id}`,
      area_id: user.area_id,
    }));
}

export async function obtainDashboardData(): Promise<DashboardData> {
  const [areas, managers, ics, feedback] = await Promise.all([
    obtainAreas(),
    obtainManagers(),
    obtainAllICs(),
    obtainAllFeedback(),
  ]);

  return {
    areas,
    managers,

    ics: (ics as unknown as Array<Record<string, unknown>>).map((ic) => ({
      IC_id: Number(ic.IC_id ?? ic.id),
      name: String(ic.name ?? ic.full_name ?? ic.IC_name ?? `IC #${ic.IC_id ?? ic.id}`),
      manager_id: Number(ic.manager_id),
    })),
    feedback,
  };
}


export function calculateDashboardMetrics(data: DashboardData, areaId: number | null): DashboardMetrics {
  const managers = areaId === null
    ? data.managers
    : data.managers.filter((manager) => manager.area_id === areaId);
  const managerIds = new Set(managers.map((manager) => manager.id));

  const ics = areaId === null
    ? data.ics
    : data.ics.filter((ic) => managerIds.has(ic.manager_id));
  const icIds = new Set(ics.map((ic) => ic.IC_id));
  const managerByIC = new Map(ics.map((ic) => [ic.IC_id, ic.manager_id]));

  const scoresByManager = new Map<number, number[]>();
  let entries = 0;
  for (const item of data.feedback) {
    if (!icIds.has(item.ic_id)) continue;
    entries += 1;

    const managerId = managerByIC.get(item.ic_id) as number;
    const scores = scoresByManager.get(managerId) ?? [];
    scores.push(item.score);
    scoresByManager.set(managerId, scores);
  }

  
  const managerAverages = [...scoresByManager.values()].map(
    (scores) => Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  );

  return {
    managers: managers.length,
    ics: ics.length,
    entries,
    averageScore: managerAverages.length > 0
      ? managerAverages.reduce((sum, score) => sum + score, 0) / managerAverages.length
      : null,
  };
}
