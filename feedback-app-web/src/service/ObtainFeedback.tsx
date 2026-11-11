import type { Feedback, FeedbackFilters, FeedbackPageResponse } from '../types/feedback';
import { API_URL } from './api';
import { authHeaders } from './authHeaders';

const URLEndpoint = `${API_URL}/feedback`;
const PAGE_LIMIT = 100;

export async function obtainFeedbackPage(page: number, limit: number = PAGE_LIMIT, filters: Partial<FeedbackFilters> = {}, signal?: AbortSignal): Promise<FeedbackPageResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters.icName) params.set('ic_name', filters.icName);
  if (filters.projectId) params.set('project_id', filters.projectId);
  if (filters.score) params.set('score', filters.score);
  if (filters.text) params.set('text', filters.text);
  if (filters.sortBy) params.set('sort', filters.sortBy);
  const response = await fetch(`${URLEndpoint}?${params}`, { headers: authHeaders(), signal });
  if (!response.ok) {
    throw new Error(`Could not load feedback (${response.status}).`);
  }
  return response.json() as Promise<FeedbackPageResponse>;
}

export async function obtainAllFeedback(): Promise<(Feedback & { ic_id: number })[]> {
  const firstPage = await obtainFeedbackPage(1);
  const totalPages = Math.max(firstPage.pagination.totalPages, 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => obtainFeedbackPage(index + 2))
  );
  return [firstPage, ...remainingPages]
    .flatMap((page) => page.data ?? [])
    .filter((item): item is Feedback & { ic_id: number } => item.ic_id !== null);
}
