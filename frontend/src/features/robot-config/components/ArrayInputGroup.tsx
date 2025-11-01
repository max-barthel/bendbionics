import { useState } from 'react';
import { NumberInput, Typography, UnitSelector } from '../../../components/ui';
import type { AngleUnit, LengthUnit } from '../../../constants/unitConversions';
import {
  convertFromSI,
  convertToSI,
  getDefaultUnit,
  getUnits,
} from '../../../utils/unitConversions';

type UnitMode = 'angle' | 'length';

type ArrayInputGroupProps = {
  readonly label: string;
  readonly values: number[]; // Always in SI units internally
  readonly onChange: (values: number[]) => void;
  readonly mode?: UnitMode;
  readonly onFieldCommit?: () => void;
};

function ArrayInputGroup({
  label,
  values,
  onChange,
  mode = 'angle',
  onFieldCommit,
}: ArrayInputGroupProps) {
  const unitOptions = getUnits(mode);
  const defaultUnit = getDefaultUnit(mode);
  const [unit, setUnit] = useState<AngleUnit | LengthUnit>(defaultUnit);

  const handleValueChange = (index: number, newDisplayValue: number) => {
    const updated = [...values];
    updated[index] = convertToSI(newDisplayValue, unit, mode);
    onChange(updated);
  };

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit as AngleUnit | LengthUnit);
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
            key={`${label}-${idx}`}
            value={Number(convertFromSI(val, unit, mode).toFixed(4))} // Rounded for UI
            onChange={value => handleValueChange(idx, value)}
            {...(onFieldCommit && { onBlur: onFieldCommit })}
            placeholder={`#${idx + 1}`}
            data-testid={`number-input-${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ArrayInputGroup;
