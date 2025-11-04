import React from 'react';
import { sliderVariants } from '@/styles/design-tokens';
import { cn, getTahoeGlassPreset } from '@/styles/tahoe-utils';
import NumberInput from './NumberInput';

// Constants
const DEFAULT_MAX_VALUE = 2000;
const DEFAULT_MIN_VALUE = 1;
const DEFAULT_STEP = 1;

type SliderInputProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onBlur?: () => void;
};

// Range display component
function RangeDisplay({ min, max }: { readonly min: number; readonly max: number }) {
  const rangeDisplayClasses = getTahoeGlassPreset('sliderRange');

  return (
    <div
      className={cn(
        'text-xs text-gray-600 px-3 py-1.5 bg-gradient-to-br from-white/15 to-white/5 shadow-lg',
        rangeDisplayClasses
      )}
    >
      {min} - {max}
    </div>
  );
}

// Slider component
function Slider({
  id,
  min,
  max,
  step,
  value,
  onChange,
  disabled,
  label,
  onBlur,
}: {
  readonly id: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly value: number;
  readonly onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  readonly disabled: boolean;
  readonly label: string | undefined;
  readonly onBlur?: () => void;
}) {
  return (
    <input
      id={id}
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      {...(onBlur && { onMouseUp: onBlur })}
      {...(onBlur && { onTouchEnd: onBlur })}
      disabled={disabled}
      aria-label={label ?? 'Slider input'}
      className={sliderVariants.input}
    />
  );
}

function SliderInput({
  value,
  onChange,
  min = DEFAULT_MIN_VALUE,
  max = DEFAULT_MAX_VALUE,
  step = DEFAULT_STEP,
  label,
  placeholder,
  disabled = false,
  className = '',
  onBlur,
}: Readonly<SliderInputProps>) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    onChange(newValue);
  };

  const sliderId = `slider-${label ? label.toLowerCase().split(/\s+/).join('-') : 'input'}`;

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-800">{label}</span>
          <RangeDisplay min={min} max={max} />
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Slider
            id={sliderId}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleSliderChange}
            {...(onBlur && { onBlur })}
            disabled={disabled}
            label={label}
          />
        </div>

        <div className="w-20">
          <NumberInput
            value={value}
            onChange={onChange}
            {...(onBlur && { onBlur })}
            {...(placeholder && { placeholder })}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

export default SliderInput;
