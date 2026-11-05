import type { Project } from '../types/feedback';
import { API_URL } from './api';
import { authHeaders } from './authHeaders';

const URLEndpoint = `${API_URL}/projects`;

export async function obtainProjects(): Promise<Project[]> {
  try {
    const response = await fetch(URLEndpoint, { headers: authHeaders() });
    const data = await response.json();
    return data.data ?? [];
  } catch (error) {
    console.error('Error retrieving projects:', error);
    return [];
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