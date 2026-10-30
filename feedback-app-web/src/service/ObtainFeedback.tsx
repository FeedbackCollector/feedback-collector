import type { Feedback } from '../types/feedback';

const URLEndpoint = 'https://localhost:3000/feedback';

export async function obtainFeedback(): Promise<Feedback[]> {
  try {
    const response = await fetch(URLEndpoint);
    const data = await response.json();
    return data.data ?? [];
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}