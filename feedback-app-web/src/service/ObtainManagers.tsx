import { API_URL } from './api';
import { authHeaders } from './authHeaders';

export interface Manager {
  id: number;
  name: string;
  email: string;
  role: string;
  area_id: number | null;
  icCount: number;
  averageScore: number | null;
}

interface IC {
  IC_id: number;
  manager_id: number;
}

interface Feedback {
  ic_id: number;
  score: number;
}

interface UsersResponse {
  data?: Omit<Manager, 'icCount' | 'averageScore'>[];
}

interface ICsResponse {
  data?: IC[];
  pagination?: {
    totalPages?: number;
  };
}

interface FeedbackResponse {
  data?: Feedback[];
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response.json() as Promise<T>;
}

async function obtainAllICs(token: string): Promise<IC[]> {
  const limit = 100;
  const headers = { Authorization: `Bearer ${token}` };
  const firstPage = await fetchJSON<ICsResponse>(`${API_URL}/ics?page=1&limit=${limit}`, { headers });
  const totalPages = firstPage.pagination?.totalPages;
  if (!Array.isArray(firstPage.data) || totalPages === undefined || !Number.isInteger(totalPages)) {
    throw new Error('The ICs response has an invalid format.');
  }

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) =>
      fetchJSON<ICsResponse>(`${API_URL}/ics?page=${index + 2}&limit=${limit}`, { headers })
    )
  );

  return [
    ...firstPage.data,
    ...remainingPages.flatMap((page) => {
      if (!Array.isArray(page.data)) {
        throw new Error('The ICs response has an invalid format.');
      }
      return page.data;
    }),
  ];
}

export async function obtainManagers(token: string | null): Promise<{
  managers: Manager[];
  totalICs: number;
  averageScore: number | null;
}> {
  if (!token) {
    throw new Error('No hay una sesión activa. Iniciá sesión y volvé a abrir My Managers.');
  }

  const [usersResponse, ics, feedbackResponse] = await Promise.all([
    fetchJSON<UsersResponse>(`${API_URL}/users`, { headers: authHeaders() }),
    obtainAllICs(token),
    fetchJSON<FeedbackResponse>(`${API_URL}/feedback?limit=100`, { headers: authHeaders() }),
  ]);

  if (!Array.isArray(usersResponse.data) || !Array.isArray(feedbackResponse.data)) {
    throw new Error('The users or feedback response has an invalid format.');
  }

  const feedbackByIC = new Map<number, number[]>();
  for (const feedback of feedbackResponse.data) {
    const scores = feedbackByIC.get(feedback.ic_id) ?? [];
    scores.push(feedback.score);
    feedbackByIC.set(feedback.ic_id, scores);
  }

  const managerICs = new Map<number, IC[]>();
  const managerScores = new Map<number, number[]>();
  for (const ic of ics) {
    const assigned = managerICs.get(ic.manager_id) ?? [];
    assigned.push(ic);
    managerICs.set(ic.manager_id, assigned);

    const scores = managerScores.get(ic.manager_id) ?? [];
    scores.push(...(feedbackByIC.get(ic.IC_id) ?? []));
    managerScores.set(ic.manager_id, scores);
  }

  const managers = usersResponse.data
    .filter((user) => user.role.toLowerCase() === 'manager')
    .map((manager) => {
      const scores = managerScores.get(manager.id) ?? [];
      return {
        ...manager,
        icCount: managerICs.get(manager.id)?.length ?? 0,
        averageScore: scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : null,
      };
    });

  const managersWithScores = managers.filter(
    (manager): manager is Manager & { averageScore: number } => manager.averageScore !== null
  );
  return {
    managers,
    totalICs: ics.length,
    averageScore: managersWithScores.length > 0
      ? managersWithScores.reduce((sum, manager) => sum + Math.round(manager.averageScore), 0) / managersWithScores.length
      : null,
  };
}
