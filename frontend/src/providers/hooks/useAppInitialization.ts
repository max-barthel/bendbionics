import { INITIALIZATION_DELAY } from '@/constants/app';
import logger, { LogContext } from '@/utils/logger';
import { useEffect } from 'react';

export function useAppInitialization(setIsInitializing: (value: boolean) => void) {
  useEffect(() => {
    // Test localStorage without alert
    const testKey = 'app_test';
    const testValue = 'app_test_value';
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);

    // Only log if localStorage test fails
    if (import.meta.env.DEV && retrievedValue !== testValue) {
      logger.debug('localStorage test failed:', LogContext.UI, {
        expected: testValue,
        actual: retrievedValue,
      });
    }
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, INITIALIZATION_DELAY);

    return () => clearTimeout(timer);
  }, [setIsInitializing]);
}
