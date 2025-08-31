import { useState } from "react";
import NumberInput from "./NumberInput";
import { LoadingSpinner, Typography } from "./ui";

type UnitMode = "angle" | "length";

type ArrayInputGroupProps = {
  label: string;
  values: number[]; // Always in SI units internally
  onChange: (values: number[]) => void;
  mode?: UnitMode;
};

function ArrayInputGroup({
  label,
  values,
  onChange,
  mode = "angle",
}: ArrayInputGroupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const angleUnits = ["deg", "rad"] as const;
  const lengthUnits = ["mm", "cm", "m"] as const;

  const angleConversion = {
    deg: {
      toSI: (v: number) => (v * Math.PI) / 180,
      fromSI: (v: number) => (v * 180) / Math.PI,
    },
    rad: {
      toSI: (v: number) => v,
      fromSI: (v: number) => v,
    },
  };

  const lengthConversion = {
    mm: {
      toSI: (v: number) => v / 1000,
      fromSI: (v: number) => v * 1000,
    },
    cm: {
      toSI: (v: number) => v / 100,
      fromSI: (v: number) => v * 100,
    },
    m: {
      toSI: (v: number) => v,
      fromSI: (v: number) => v,
    },
  };

  const unitOptions = mode === "angle" ? angleUnits : lengthUnits;
  const defaultUnit = mode === "angle" ? "deg" : "mm";
  const [unit, setUnit] = useState<(typeof unitOptions)[number]>(defaultUnit);

  const convertToSI = (v: number) =>
    mode === "angle"
      ? angleConversion[unit as "deg" | "rad"].toSI(v)
      : lengthConversion[unit as "mm" | "cm" | "m"].toSI(v);

  const convertFromSI = (v: number) =>
    mode === "angle"
      ? angleConversion[unit as "deg" | "rad"].fromSI(v)
      : lengthConversion[unit as "mm" | "cm" | "m"].fromSI(v);

  const handleValueChange = async (index: number, newDisplayValue: number) => {
    setIsUpdating(true);
    const updated = [...values];
    updated[index] = convertToSI(newDisplayValue);
    onChange(updated);

    // Simulate processing delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 100));
    setIsUpdating(false);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit as (typeof unitOptions)[number]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Typography
            variant="label"
            color="neutral"
            as="label"
            htmlFor={`${label}-unit-select`}
          >
            {label}
          </Typography>
          {isUpdating && <LoadingSpinner size="sm" color="primary" />}
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {unitOptions.map((u) => (
            <button
              key={u}
              onClick={() => handleUnitChange(u)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                unit === u
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
              aria-label={`${label} unit ${u}`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          values.length <= 3
            ? "grid-cols-3"
            : values.length <= 5
            ? "grid-cols-3"
            : values.length <= 8
            ? "grid-cols-4"
            : "grid-cols-5"
        }`}
      >
        {values.map((val, idx) => (
          <NumberInput
            key={idx}
            value={Number(convertFromSI(val).toFixed(4))} // Rounded for UI
            onChange={(value) => handleValueChange(idx, value)}
            placeholder={`#${idx + 1}`}
            label={`${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ArrayInputGroup;
