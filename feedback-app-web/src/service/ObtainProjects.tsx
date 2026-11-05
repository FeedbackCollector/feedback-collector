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
}
