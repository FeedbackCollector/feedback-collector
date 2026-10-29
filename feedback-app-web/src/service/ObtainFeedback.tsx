import type { Feedback } from '../types/feedback';

const URLEndpoint = 'https://feedback-collector-fycv.onrender.com/feedback';

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