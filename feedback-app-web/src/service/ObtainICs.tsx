import type { IC } from '../types/feedback';
import { API_URL } from './api';

const URLEndpoint = `${API_URL}/ics`;

export async function obtainICs(): Promise<IC[]> {
  try {
    const response = await fetch(URLEndpoint);
    const data = await response.json();
    return data.data ?? [];
  } catch (error) {
    console.error('Error retrieving ICs:', error);
    return [];
  }
}
