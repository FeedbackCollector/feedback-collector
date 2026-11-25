import type { FeedbackFilters } from '../types/feedback';
import { API_URL } from './api';
import { authHeaders } from './authHeaders';

export async function exportFeedbackCsv(filters: FeedbackFilters): Promise<void> {
  const params = new URLSearchParams();

  const icName = filters.icName?.trim();
  const text = filters.text?.trim();

  if (icName) params.set('ic_name', icName);
  if (text) params.set('text', text);
  if (filters.projectId) params.set('project_id', filters.projectId);
  if (filters.score) params.set('score', filters.score);
  if (filters.sortBy) params.set('sort', filters.sortBy);

  const query = params.toString();
  const response = await fetch(`${API_URL}/feedback/export.csv${query ? `?${query}` : ''}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Could not export the CSV (${response.status}).`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'feedback.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
