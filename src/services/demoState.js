import { useEffect, useState } from 'react';

export function useDemoState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(`learning-hub:${key}`);
      return saved === null ? initialValue : JSON.parse(saved);
    } catch (error) {
      console.error(`Unable to restore demo state "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(`learning-hub:${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to persist demo state "${key}".`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
