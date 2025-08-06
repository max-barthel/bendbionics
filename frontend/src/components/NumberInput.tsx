import { useEffect, useState } from "react";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);

    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else if (val === "") {
      onChange(NaN); // allow emptiness temporarily
    }
  };

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*"
      value={internalValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-3 text-[15px] rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition disabled:opacity-50 max-w-fit"
    />
  );
}

export default NumberInput;
