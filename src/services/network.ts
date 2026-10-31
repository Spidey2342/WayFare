type OnlineListener = (online: boolean) => void;

export function readOnline(): boolean {
  const nav = globalThis.navigator as { onLine?: boolean } | undefined;
  return nav?.onLine !== false;
}

export function subscribeOnline(listener: OnlineListener): () => void {
  const target = globalThis as {
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
  if (
    typeof target.addEventListener !== 'function' ||
    typeof target.removeEventListener !== 'function'
  ) {
    listener(true);
    return () => undefined;
  }
  const update = () => listener(readOnline());
  update();
  target.addEventListener('online', update);
  target.addEventListener('offline', update);
  return () => {
    target.removeEventListener?.('online', update);
    target.removeEventListener?.('offline', update);
  };
}
