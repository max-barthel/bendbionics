import NumberInput from "./NumberInput";

type ArrayInputGroupProps = {
  label: string;
  values: number[];
  onChange: (values: number[]) => void;
};

function ArrayInputGroup({ label, values, onChange }: ArrayInputGroupProps) {
  const handleValueChange = (index: number, newValue: number) => {
    const updated = [...values];
    updated[index] = newValue;
    onChange(updated);
  };

  return (
    <div className="w-full space-y-2">
      <div className="text-sm font-medium text-neutral-600">{label}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {values.map((val, idx) => (
          <NumberInput
            key={idx}
            placeholder={`#${idx + 1}`}
            value={val}
            onChange={(value) => handleValueChange(idx, value)}
          />
        ))}
      </div>
    </div>
  );
}

export default ArrayInputGroup;
