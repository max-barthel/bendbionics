type NumberInputProps = {
  placeholder: string;
  value: number | string;
  onChange: (value: number) => void;
  disabled?: boolean;
};

function NumberInput({
  placeholder,
  value,
  onChange,
  disabled = false,
}: NumberInputProps) {
  return (
    <input
      type="text"
      inputMode="decimal"
      pattern="[0-9]*"
      value={value}
      onChange={(e) => {
        const parsed = parseFloat(e.target.value);
        if (!isNaN(parsed)) onChange(parsed);
        else if (e.target.value === "") onChange(NaN);
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-3 text-[15px] rounded-xl border border-neutral-300 bg-neutral-100 text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition disabled:opacity-50`}
    />
  );
}

export default NumberInput;
