import { useEffect, useState } from 'react';
import { Input } from '../../../components/ui';

type NumberInputProps = {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly placeholder?: string;
  readonly label?: string;
  readonly id?: string;
  readonly disabled?: boolean;
};

function NumberInput({
  value,
  onChange,
  placeholder,
  label,
  id,
  disabled = false,
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState<string>(value.toString());

  // Sync external value with internal string
  useEffect(() => {
    if (value !== parseFloat(internalValue)) {
      setInternalValue(isNaN(value) ? '' : value.toString());
    }
  }, [value, internalValue]);

  const handleChange = (newValue: string | number) => {
    if (typeof newValue === 'string') {
      setInternalValue(newValue);
      const parsed = parseFloat(newValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      }
      // Don't call onChange for invalid numbers, just update internal state
    } else {
      // If it's already a number, use it directly
      setInternalValue(newValue.toString());
      onChange(newValue);
    }
  };

  return (
    <Input
      {...(id && { id })}
      type="text"
      size="sm"
      value={internalValue}
      onChange={handleChange}
      {...(placeholder && { placeholder })}
      {...(label && { label })}
      disabled={disabled}
    />
  );
}

export default NumberInput;
