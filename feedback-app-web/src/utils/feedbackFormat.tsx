export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function truncateText(value: string | null | undefined, max: number): string {
  const text = (value ?? '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

export const MAX_SOURCE_LEN = 40;
export const MAX_NAME_LEN = 40;
export const MAX_EXCERPT_LEN = 120;
export const MAX_BODY_LEN = 300;
export const MAX_SOURCE_TITLE_LEN = 40;
export const MAX_COMMENT_LEN = 300;
