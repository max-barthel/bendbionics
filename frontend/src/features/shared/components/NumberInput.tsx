import { useEffect, useState } from 'react';
import { Input } from '../../../components/ui';

type NumberInputProps = {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly placeholder?: string;
  readonly label?: string;
  readonly id?: string;
  readonly disabled?: boolean;
  readonly onBlur?: () => void;
};

function NumberInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  disabled = false,
  onBlur,
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState<string>(value.toString());
  const [showEmptyError, setShowEmptyError] = useState(false);

  // Sync external value with internal string
  useEffect(() => {
    if (internalValue === '') {
      // Allow empty while editing; don't overwrite with external value
      return;
    }
    if (value !== Number.parseFloat(internalValue)) {
      setInternalValue(Number.isNaN(value) ? '' : value.toString());
    }
  }, [value, internalValue]);

  const handleChange = (newValue: string | number) => {
    if (typeof newValue === 'string') {
      setInternalValue(newValue);
      const parsed = Number.parseFloat(newValue);
      if (!Number.isNaN(parsed)) {
        onChange(parsed);
        if (showEmptyError) setShowEmptyError(false);
      }
      // Don't call onChange for invalid numbers, just update internal state
    } else {
      // If it's already a number, use it directly
      setInternalValue(newValue.toString());
      onChange(newValue);
      if (showEmptyError) setShowEmptyError(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (internalValue.trim() === '') {
        setShowEmptyError(true);
        return;
      }
      onBlur?.();
    }
  };

  const handleBlurInternal = () => {
    if (internalValue.trim() === '') {
      setShowEmptyError(true);
      return;
    }
    onBlur?.();
  };

  return (
    <Input
      {...(id && { id })}
      type="text"
      size="sm"
      value={internalValue}
      onChange={handleChange}
      onBlur={handleBlurInternal}
      onKeyDown={handleKeyDown}
      {...(placeholder && { placeholder })}
      {...(label && { label })}
      {...(showEmptyError && { error: 'Required' })}
      disabled={disabled}
    />
  );
}

export default NumberInput;
