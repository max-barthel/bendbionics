import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = globalThis.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // CRITICAL FIX: For function updates, we must pass the function directly to React's setState
      // so React can call it with the pending state. If we call it here with storedValue,
      // we're using stale state when multiple updates are batched.
      if (typeof value === 'function') {
        // Pass function directly to React's setState - React will call it with the correct pending state
        setStoredValue(prevState => {
          const valueToStore = (value as (val: T) => T)(prevState);
          // Persist to localStorage after computing the new value
          globalThis.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } else {
        // For direct values, update both state and localStorage
        setStoredValue(value);
        globalThis.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Constants for default robot settings
const DEFAULT_ROBOT_SETTINGS = {
  SEGMENTS: 5,
  DEFAULT_BACKBONE_LENGTH: 0.07,
  DEFAULT_COUPLING_LENGTH: 0.03,
  DISCRETIZATION_STEPS: 1000,
} as const;

// Hook for managing robot settings in local storage
export function useRobotSettings() {
  const [settings, setSettings] = useLocalStorage('bendbionics-settings', {
    segments: DEFAULT_ROBOT_SETTINGS.SEGMENTS,
    bendingAngles: [0, 0, 0, 0, 0],
    rotationAngles: [0, 0, 0, 0, 0],
    backboneLengths: [
      DEFAULT_ROBOT_SETTINGS.DEFAULT_BACKBONE_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_BACKBONE_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_BACKBONE_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_BACKBONE_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_BACKBONE_LENGTH,
    ],
    couplingLengths: [
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
      DEFAULT_ROBOT_SETTINGS.DEFAULT_COUPLING_LENGTH,
    ],
    discretizationSteps: DEFAULT_ROBOT_SETTINGS.DISCRETIZATION_STEPS,
  });

  return [settings, setSettings] as const;
}

// Hook for managing local presets
export function useLocalPresets() {
  const [presets, setPresets] = useLocalStorage<Record<string, unknown>[]>(
    'bendbionics-presets',
    []
  );

  const addPreset = (preset: Record<string, unknown>) => {
    const newPreset = {
      ...preset,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPresets(prev => [...prev, newPreset]);
  };

  const updatePreset = (id: number, updates: Record<string, unknown>) => {
    setPresets(prev =>
      prev.map(preset =>
        preset['id'] === id
          ? { ...preset, ...updates, updated_at: new Date().toISOString() }
          : preset
      )
    );
  };

  const deletePreset = (id: number) => {
    setPresets(prev => prev.filter(preset => preset['id'] !== id));
  };

  return {
    presets,
    addPreset,
    updatePreset,
    deletePreset,
  };
}
