import React from 'react';
import NumberInput from '../../features/shared/components/NumberInput';
import { combineStyles, getTahoeGlassStyles } from '../../styles/tahoe-utils';

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
  const rangeDisplayClasses = getTahoeGlassStyles(
    'subtle',
    'glass',
    'full',
    'standard',
    'white',
    'glass'
  );

  return (
    <div
      className={combineStyles(
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
      className={`w-full h-2 appearance-none cursor-pointer rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-400/50 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white/50 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-500/90 [&::-webkit-slider-thumb]:to-indigo-600/90 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white/50 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-blue-500/90 [&::-moz-range-thumb]:to-indigo-600/90`}
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
    <div className={combineStyles('space-y-4', className)}>
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
