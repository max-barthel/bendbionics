import React from "react";
import { TahoeNumberInput } from "./TahoeNumberInput";

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
  size?: "sm" | "md" | "lg";
  "data-testid"?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 3,
  placeholder,
  className = "",
  disabled = false,
  size = "md",
  "data-testid": dataTestId,
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
