let localSeq = 0;

export function newLocalDebateId(prefix: 'solo' | 'pass'): string {
  localSeq += 1;
  return `${prefix}_${localSeq}`;
}
