const COLOR_PALETTE = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#9333ea',
  '#d97706',
  '#0d9488',
  '#4f46e5',
  '#db2777',
];

export function getInitials(fullName: string): string {
  if (!fullName) return '??';
  
  const words = fullName.trim().split(' ');
  
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  
  const firstLetter = words[0][0];
  const lastLetter = words[words.length - 1][0];
  
  return (firstLetter + lastLetter).toUpperCase();
}

export function getAvatarColor(id: string | number, entityType: string = 'user'): string {
  const uniqueKey = `${entityType}-${id}`;
  
  let charCodeSum = 0;
  for (let i = 0; i < uniqueKey.length; i++) {
    charCodeSum += uniqueKey.charCodeAt(i);
  }
  
  const colorIndex = charCodeSum % COLOR_PALETTE.length;
  return COLOR_PALETTE[colorIndex];
}