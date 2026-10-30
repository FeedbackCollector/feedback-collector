import type { Project } from '../types/feedback';
import { useAuthStore } from '../store/authStore';

const URL_ENDPOINT = 'https://localhost:3000/projects';

export type ProjectInput = {
  name: string;
};

async function request<T>(url: string, init: RequestInit = {}): Promise<T | null> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const token = useAuthStore.getState().token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();
  return (data.data ?? data) as T;
}

export async function getProjects(): Promise<Project[]> {
  const data = await request<Project[]>(URL_ENDPOINT);
  return data ?? [];
}

export async function getProjectById(id: number): Promise<Project> {
  const data = await request<Project>(`${URL_ENDPOINT}/${id}`);
  if (!data) {
    throw new Error('Project not found');
  }
  return data;
}

export async function createProject(input: ProjectInput): Promise<Project> {
  const data = await request<Project>(URL_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  if (!data) {
    throw new Error('Empty response when creating project');
  }
  return data;
}

export async function updateProject(
  id: number,
  input: Partial<ProjectInput>
): Promise<Project> {
  const data = await request<Project>(`${URL_ENDPOINT}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
  if (!data) {
    throw new Error('Empty response when updating project');
  }
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await request<null>(`${URL_ENDPOINT}/${id}`, { method: 'DELETE' });
}