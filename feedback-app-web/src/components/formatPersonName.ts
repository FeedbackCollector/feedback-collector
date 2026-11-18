export function formatPersonName(name: string | null | undefined): string {
  if (!name) return '';

  return name
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('es')
    .replace(/(^|[\s'-])\p{L}/gu, (letter) => letter.toLocaleUpperCase('es'));
}
