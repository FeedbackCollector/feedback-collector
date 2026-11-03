import type { Feedback } from '../types/feedback';
import { API_URL } from './api';

const URLEndpoint = `${API_URL}/feedback`;

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