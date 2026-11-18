import type { ManagerFeedback, ManagerFeedbackFilters, ManagerFeedbackPageResponse } from '../types/feedback';
import { API_URL } from './api';
import { authHeaders } from './authHeaders';

const URLEndpoint = `${API_URL}/manager-feedback`;
const PAGE_LIMIT = 100;

export type ManagerFeedbackPayload = {
  manager_id: number;
  project_id: number;
  date: string;
  source_name: string;
  source_title: string;
  score: number;
  comment: string | null;
  screenshot_url: string | null;
};

export async function obtainManagerFeedbackPage(
  page: number,
  limit: number = PAGE_LIMIT,
  filters: ManagerFeedbackFilters,
  signal?: AbortSignal
): Promise<ManagerFeedbackPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    manager_id: String(filters.managerId),
  });
  if (filters.sortBy) params.set('sort', filters.sortBy);

  const response = await fetch(`${URLEndpoint}?${params}`, { headers: authHeaders(), signal });
  if (!response.ok) {
    throw new Error(`Could not load manager feedback (${response.status}).`);
  }
  return response.json() as Promise<ManagerFeedbackPageResponse>;
}

export async function obtainAllManagerFeedback(filters: ManagerFeedbackFilters): Promise<ManagerFeedback[]> {
  const firstPage = await obtainManagerFeedbackPage(1, PAGE_LIMIT, filters);
  const totalPages = Math.max(firstPage.pagination.totalPages, 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      obtainManagerFeedbackPage(index + 2, PAGE_LIMIT, filters)
    )
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.data ?? []);
}

async function readError(response: Response, fallback: string): Promise<Error> {
  const text = await response.text();
  return new Error(text || `${fallback} (${response.status})`);
}

export async function saveManagerFeedback(payload: ManagerFeedbackPayload, id?: number): Promise<void> {
  const response = await fetch(id === undefined ? URLEndpoint : `${URLEndpoint}/${id}`, {
    method: id === undefined ? 'POST' : 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await readError(response, 'Request failed with status');
}

export async function deleteManagerFeedback(id: number): Promise<void> {
  const response = await fetch(`${URLEndpoint}/${id}`, { method: 'DELETE', headers: authHeaders() });
  if (!response.ok) throw await readError(response, 'Request failed with status');
}

// Screenshots are stored by the same endpoint IC feedback uses.
export async function uploadManagerFeedbackScreenshot(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);
  const response = await fetch(`${API_URL}/feedback/screenshot`, { method: 'POST', headers: authHeaders(), body });
  if (!response.ok) throw await readError(response, 'Screenshot upload failed');
  return (await response.json()).url as string;
}

export interface ManagerInfo {
  id: number;
  name: string;
  email: string;
  area_id: number | null;
}

export async function obtainManagerById(id: number): Promise<ManagerInfo> {
  const response = await fetch(`${API_URL}/users/${id}`, { headers: authHeaders() });
  if (!response.ok) throw new Error(`Could not load manager (${response.status}).`);
  const body = await response.json();
  const user = body.data ?? body;
  if (user.role !== 'manager') throw new Error('The selected user is not a manager.');
  return user as ManagerInfo;
}
