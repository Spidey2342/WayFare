import { useEffect, useState } from 'react';

import { readOnline, subscribeOnline } from '@/services/network';

export function useOnline(): boolean {
  const [online, setOnline] = useState(readOnline);
  useEffect(() => subscribeOnline(setOnline), []);
  return online;
}
