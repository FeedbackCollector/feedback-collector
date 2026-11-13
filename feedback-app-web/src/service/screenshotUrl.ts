import { API_URL } from './api';

export function resolveScreenshotUrl(url: string): string {
  if (url.startsWith('/uploads/')) return `${API_URL}${url}`;
  try {
    const { pathname } = new URL(url);
    if (pathname.startsWith('/uploads/')) return `${API_URL}${pathname}`;
  } catch {
  }
  return url;
}
