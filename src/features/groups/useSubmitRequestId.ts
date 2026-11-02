import { useEffect, useRef } from 'react';

function newRequestId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** One request_id per stable form snapshot; new id when user edits key fields. */
export function useSubmitRequestId(name: string, description: string, isPrivate: boolean) {
  const requestId = useRef(newRequestId());

  useEffect(() => {
    requestId.current = newRequestId();
  }, [name, description, isPrivate]);

  return {
    getRequestId: () => requestId.current,
  };
}
