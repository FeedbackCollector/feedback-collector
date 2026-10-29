import type { Project } from '../types/feedback';

const URLEndpoint = 'https://feedback-collector-fycv.onrender.com/projects';

export async function obtainProjects(): Promise<Project[]> {
  try {
    const response = await fetch(URLEndpoint);
    const data = await response.json();
    return data.data ?? [];
  } catch (error) {
    console.error('Error retrieving projects:', error);
    return [];
  }
}
