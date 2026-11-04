import { API_URL } from './api';

export interface Area {
  id: number;
  name: string;
}

interface AreasResponse {
  data?: Area[];
}

export async function obtainAreas(): Promise<Area[]> {
  const response = await fetch(`${API_URL}/areas`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}): ${API_URL}/areas`);
  }

  const result = await response.json() as AreasResponse;
  if (!Array.isArray(result.data)) {
    throw new Error('The areas response has an invalid format.');
  }

  return result.data;
}
