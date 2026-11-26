import { useCallback, useState } from '../lib/html.js';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw);
      }
    } catch (_) {
      // Ignore storage restrictions
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  const setValue = useCallback(
    (updater) => {
      setStoredValue((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (_) {
          // Ignore quota or privacy errors
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
