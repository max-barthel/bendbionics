import { useEffect, useRef, useState } from 'react';

// Progress and timeout constants
const PROGRESS_CONFIG = {
  INITIAL: 15,
  COMPLETE: 90,
  FINAL: 200,
} as const;

/**
 * Hook for tracking progress of async operations
 *
 * Provides a progress value that simulates progress for better UX.
 * Automatically cleans up interval on unmount.
 */
export function useProgressTracking(isLoading: boolean) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isLoading) {
      setProgress(0);
      // Simulate progress for better UX
      intervalRef.current = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * PROGRESS_CONFIG.INITIAL;
          return Math.min(newProgress, PROGRESS_CONFIG.COMPLETE);
        });
      }, PROGRESS_CONFIG.FINAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Set to 100 when complete, or reset to 0 if not successful
      setProgress(prev => (prev > 0 ? 100 : 0));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isLoading]);

  const setProgressComplete = () => {
    setProgress(100);
  };

  const resetProgress = () => {
    setProgress(0);
  };

  return { progress, setProgressComplete, resetProgress };
}

