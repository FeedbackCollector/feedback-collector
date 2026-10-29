import type { IC } from '../types/feedback';

const URLEndpoint = 'https://feedback-api-latest-moe8.onrender.com/ics';

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
