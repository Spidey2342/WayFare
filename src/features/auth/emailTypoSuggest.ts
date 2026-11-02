const COMMON_DOMAINS = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com'];

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );
  for (let i = 0; i < rows; i += 1) matrix[i]![0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0]![j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost,
      );
    }
  }
  return matrix[a.length]![b.length]!;
}

export function suggestEmailDomain(email: string): string | null {
  const at = email.indexOf('@');
  if (at <= 0) return null;
  const domain = email.slice(at + 1).toLowerCase();
  if (!domain || COMMON_DOMAINS.includes(domain)) return null;
  let best: string | null = null;
  let bestDist = 99;
  for (const candidate of COMMON_DOMAINS) {
    const dist = levenshtein(domain, candidate);
    if (dist < bestDist && dist <= 2) {
      bestDist = dist;
      best = candidate;
    }
  }
  if (!best) return null;
  return `${email.slice(0, at + 1)}${best}`;
}
