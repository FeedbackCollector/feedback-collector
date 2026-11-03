import { API_URL } from './api';

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

async function fetchJSON<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${url}`);
  }
  return response.json() as Promise<T>;
}

async function obtainAllICs(): Promise<IC[]> {
  const limit = 100;
  const firstPage = await fetchJSON<ICsResponse>(`${API_URL}/ics?page=1&limit=${limit}`);
  if (!Array.isArray(firstPage.data) || !Number.isInteger(firstPage.pagination?.totalPages)) {
    throw new Error('The ICs response has an invalid format.');
  }

  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, firstPage.pagination.totalPages - 1) }, (_, index) =>
      fetchJSON<ICsResponse>(`${API_URL}/ics?page=${index + 2}&limit=${limit}`)
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

export async function obtainManagers(): Promise<{
  managers: Manager[];
  totalICs: number;
  averageScore: number | null;
}> {
  const [usersResponse, ics, feedbackResponse] = await Promise.all([
    fetchJSON<UsersResponse>(`${API_URL}/users`),
    obtainAllICs(),
    fetchJSON<FeedbackResponse>(`${API_URL}/feedback`),
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
