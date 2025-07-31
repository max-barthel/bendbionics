import React from "react";
import "./ArrayInputGroup.css";
import NumberInput from "./NumberInput";

type ArrayInputGroupProps = {
  label: string;
  values: number[];
  onChange: (values: number[]) => void;
};

const ArrayInputGroup: React.FC<ArrayInputGroupProps> = ({
  label,
  values,
  onChange,
}) => {
  const handleValueChange = (index: number, newValue: number) => {
    const updated = [...values];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="array-input-group">
      <label>{label}</label>
      <div className="input-row">
        {values.map((val, idx) => (
          <NumberInput
            key={idx}
            label={`#${idx + 1}`}
            value={val}
            onChange={(value) => handleValueChange(idx, value)}
          />
        ))}
      </div>
    </div>
  );
};

export default ArrayInputGroup;
