import { useEffect, useState } from "react";
import { Input } from "./ui";

type NumberInputProps = {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
};

function NumberInput({
  value,
  onChange,
  placeholder,
  id,
  disabled = false,
}: NumberInputProps) {
  const [internalValue, setInternalValue] = useState<string>(value.toString());

  // Sync external value with internal string
  useEffect(() => {
    if (value !== parseFloat(internalValue)) {
      setInternalValue(isNaN(value) ? "" : value.toString());
    }
  }, [value]);

  const handleChange = (newValue: string | number) => {
    if (typeof newValue === "string") {
      setInternalValue(newValue);
      const parsed = parseFloat(newValue);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else if (newValue === "") {
        onChange(NaN); // allow emptiness temporarily
      }
    } else {
      onChange(newValue);
    }
  };

  return (
    <Input
      id={id}
      type="text"
      size="md"
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export default NumberInput;
