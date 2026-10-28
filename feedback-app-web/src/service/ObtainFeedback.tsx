import type { Feedback } from '../types/feedback';

const URLEndpoint = 'https://feedback-api-latest-moe8.onrender.com/feedback';

export async function obtainFeedback(): Promise<Feedback[]> {
  try {
    const response = await fetch(URLEndpoint);
    const json = await response.json();
    return json.data ?? [];
  } catch (error) {
    console.error('Error feedback:', error);
    return [];
  }
}