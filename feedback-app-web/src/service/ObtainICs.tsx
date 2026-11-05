import type { IC } from '../types/feedback';
import { API_URL } from './api';
import { authHeaders } from './authHeaders';

const URLEndpoint = `${API_URL}/ics`;
const PAGE_LIMIT = 100;

export interface ICPageResponse {
  data: IC[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function obtainICPage(page: number, managerId?: number, limit: number = PAGE_LIMIT): Promise<ICPageResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (managerId !== undefined) params.set('manager_id', String(managerId));
  const response = await fetch(`${URLEndpoint}?${params}`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error(`Could not load ICs (${response.status}).`);
  }
  return response.json() as Promise<ICPageResponse>;
}

export async function obtainAllICs(managerId?: number): Promise<IC[]> {
  const firstPage = await obtainICPage(1, managerId);
  const totalPages = Math.max(firstPage.pagination.totalPages, 1);
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => obtainICPage(index + 2, managerId))
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.data ?? []);
}

export async function obtainICs(): Promise<IC[]> {
  try {
    return await obtainAllICs();
  } catch (error) {
    console.error('Error retrieving ICs:', error);
    return [];
  }
}
