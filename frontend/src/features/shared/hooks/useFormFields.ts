import { useCallback, useState } from 'react';

/**
 * Field definition for useFormFields
 */
export interface FormFieldDefinition {
  /**
   * Field name (used as key)
   */
  readonly name: string;

  /**
   * Initial value
   */
  readonly initialValue?: string;
}

/**
 * Return type for individual field state
 */
export interface FormFieldState {
  /**
   * Current field value
   */
  readonly value: string;

  /**
   * Setter function that accepts string or number (for compatibility with Input onChange)
   */
  readonly setValue: (value: string | number) => void;
}

/**
 * Return type for useFormFields hook
 */
export interface UseFormFieldsReturn<T extends readonly FormFieldDefinition[]> {
  /**
   * Get field state by index
   */
  readonly getField: (index: number) => FormFieldState;

  /**
   * Get field state by name
   */
  readonly getFieldByName: (name: T[number]['name']) => FormFieldState | undefined;

  /**
   * Get all field values as an object
   */
  readonly getValues: () => Record<string, string>;

  /**
   * Reset all fields to their initial values
   */
  readonly reset: () => void;

  /**
   * Set all field values at once
   */
  readonly setValues: (values: Partial<Record<string, string>>) => void;
}

/**
 * Generic hook for managing multiple form field states
 *
 * Consolidates the common pattern of managing multiple useState calls for form fields.
 * Reduces boilerplate and provides a consistent API for form state management.
 *
 * @example
 * ```tsx
 * const fields = useFormFields([
 *   { name: 'username', initialValue: '' },
 *   { name: 'password', initialValue: '' },
 * ]);
 *
 * // Use field by index
 * <Input
 *   value={fields.getField(0).value}
 *   onChange={fields.getField(0).setValue}
 * />
 *
 * // Or use field by name
 * <Input
 *   value={fields.getFieldByName('username')?.value}
 *   onChange={fields.getFieldByName('username')?.setValue}
 * />
 * ```
 */
export function useFormFields<T extends readonly FormFieldDefinition[]>(
  fieldDefinitions: T
): UseFormFieldsReturn<T> {
  // Initialize state for all fields
  const initialValues = fieldDefinitions.reduce(
    (acc, field) => {
      acc[field.name] = field.initialValue ?? '';
      return acc;
    },
    {} as Record<string, string>
  );

  const [values, setValues] = useState<Record<string, string>>(initialValues);

  // Create setter for a specific field
  const createFieldSetter = useCallback((fieldName: string) => {
    return (value: string | number) => {
      setValues(prev => ({
        ...prev,
        [fieldName]: String(value),
      }));
    };
  }, []);

  // Get field state by index
  const getField = useCallback(
    (index: number): FormFieldState => {
      const field = fieldDefinitions[index];
      if (!field) {
        throw new Error(`Field at index ${index} does not exist`);
      }
      return {
        value: values[field.name] ?? '',
        setValue: createFieldSetter(field.name),
      };
    },
    [fieldDefinitions, values, createFieldSetter]
  );

  // Get field state by name
  const getFieldByName = useCallback(
    (name: T[number]['name']): FormFieldState | undefined => {
      const field = fieldDefinitions.find(f => f.name === name);
      if (!field) {
        return undefined;
      }
      return {
        value: values[field.name] ?? '',
        setValue: createFieldSetter(field.name),
      };
    },
    [fieldDefinitions, values, createFieldSetter]
  );

  // Get all values as object
  const getValues = useCallback(() => {
    return { ...values };
  }, [values]);

  // Reset all fields to initial values
  const reset = useCallback(() => {
    setValues(initialValues);
  }, [initialValues]);

  // Set multiple values at once
  const setValuesBatch = useCallback((newValues: Partial<Record<string, string>>) => {
    setValues(prev => {
      const updated = { ...prev };
      // Only update defined values (filter out undefined)
      for (const [key, value] of Object.entries(newValues)) {
        if (value !== undefined) {
          updated[key] = value;
        }
      }
      return updated;
    });
  }, []);

  return {
    getField,
    getFieldByName,
    getValues,
    reset,
    setValues: setValuesBatch,
  };
}
