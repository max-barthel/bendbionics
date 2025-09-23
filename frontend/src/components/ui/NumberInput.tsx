import React from 'react';
import { TahoeNumberInput } from './TahoeNumberInput';

// Constants
const DEFAULT_PRECISION = 3;

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  'data-testid'?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = DEFAULT_PRECISION,
  placeholder,
  className = '',
  disabled = false,
  size = 'md',
  'data-testid': dataTestId,
}) => {
  return (
    <TahoeNumberInput
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      step={step}
      precision={precision}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      size={size}
      data-testid={dataTestId}
    />
  );
};

export default NumberInput;
