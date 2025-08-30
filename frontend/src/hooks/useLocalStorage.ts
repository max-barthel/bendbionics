import { useState } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then parse stored json or return initialValue
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook for managing robot settings in local storage
export function useRobotSettings() {
  const [settings, setSettings] = useLocalStorage('soft-robot-settings', {
    segments: 5,
    bendingAngles: [0.628319, 0.628319, 0.628319, 0.628319, 0.628319],
    rotationAngles: [0, 0, 0, 0, 0],
    backboneLengths: [0.07, 0.07, 0.07, 0.07, 0.07],
    couplingLengths: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
    discretizationSteps: 1000,
  });

  return [settings, setSettings] as const;
}

// Hook for managing local presets
export function useLocalPresets() {
  const [presets, setPresets] = useLocalStorage<any[]>('soft-robot-presets', []);

  const addPreset = (preset: any) => {
    const newPreset = {
      ...preset,
      id: Date.now(), // Simple ID generation
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setPresets((prev) => [...prev, newPreset]);
  };

  const updatePreset = (id: number, updates: any) => {
    setPresets((prev) =>
      prev.map((preset) =>
        preset.id === id
          ? { ...preset, ...updates, updated_at: new Date().toISOString() }
          : preset
      )
    );
  };

  const deletePreset = (id: number) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== id));
  };

  return {
    presets,
    addPreset,
    updatePreset,
    deletePreset,
  };
}
