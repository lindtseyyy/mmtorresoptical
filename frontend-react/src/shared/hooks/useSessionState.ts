import { useState, useCallback } from "react";

export function useSessionState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // ignore corrupted data
    }
    return defaultValue;
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          // ignore quota errors
        }
        return next;
      });
    },
    [key]
  );

  return [state, setValue];
}
