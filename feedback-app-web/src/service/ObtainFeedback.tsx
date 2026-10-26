import type { Feedback } from '../types/feedback';

const URLEnpoint = ''

export async function obtainFeedback(): Promise<Feedback[]> {
  try {
    const response = await fetch(URLEnpoint); 
    const data = await response.json();
    return data ?? [];
  } catch (error) {
    console.error('Error retrieving feedback:', error);
    return [];
  }
}