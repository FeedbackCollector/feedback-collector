import type { IC } from '../types/feedback';

const URLEndpoint = 'http://localhost:3000/ics';

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
