import React from "react";
import "./NumberInput.css";

type NumberInputProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
};

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  step = 0.01,
}) => {
  return (
    <div className="number-input">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default NumberInput;
