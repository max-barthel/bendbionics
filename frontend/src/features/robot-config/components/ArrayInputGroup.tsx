import { useEffect, useRef, useState } from 'react';
import { LoadingSpinner, Typography, UnitSelector } from '../../../components/ui';
import NumberInput from '../../shared/components/NumberInput';

type UnitMode = 'angle' | 'length';

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
  mode = 'angle',
}: ArrayInputGroupProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const angleUnits = ['deg', 'rad'] as const;
  const lengthUnits = ['mm', 'cm', 'm'] as const;

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

  const unitOptions = mode === 'angle' ? angleUnits : lengthUnits;
  const defaultUnit = mode === 'angle' ? 'deg' : 'mm';
  const [unit, setUnit] = useState<(typeof unitOptions)[number]>(defaultUnit);

  const convertToSI = (v: number) =>
    mode === 'angle'
      ? angleConversion[unit as 'deg' | 'rad'].toSI(v)
      : lengthConversion[unit as 'mm' | 'cm' | 'm'].toSI(v);

  const convertFromSI = (v: number) =>
    mode === 'angle'
      ? angleConversion[unit as 'deg' | 'rad'].fromSI(v)
      : lengthConversion[unit as 'mm' | 'cm' | 'm'].fromSI(v);

  const handleValueChange = (index: number, newDisplayValue: number) => {
    setIsUpdating(true);
    const updated = [...values];
    updated[index] = convertToSI(newDisplayValue);
    onChange(updated);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate processing delay for better UX
    timeoutRef.current = setTimeout(() => {
      setIsUpdating(false);
    }, 100);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit as (typeof unitOptions)[number]);
  };

  return (
    <div className="flex flex-col gap-4">
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
        <UnitSelector
          units={unitOptions}
          selectedUnit={unit}
          onUnitChange={handleUnitChange}
          ariaLabel={label}
        />
      </div>

      <div className="grid gap-3 gap-y-4 ml-2 grid-cols-3">
        {values.map((val, idx) => (
          <NumberInput
            key={idx}
            value={Number(convertFromSI(val).toFixed(4))} // Rounded for UI
            onChange={value => handleValueChange(idx, value)}
            placeholder={`#${idx + 1}`}
            data-testid={`number-input-${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ArrayInputGroup;
