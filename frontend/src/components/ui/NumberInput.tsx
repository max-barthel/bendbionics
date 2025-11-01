import { TahoeNumberInput } from './TahoeNumberInput';

// Constants
const DEFAULT_PRECISION = 3;

interface NumberInputProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number; // Note: step is accepted but handled by precision
  readonly precision?: number;
  readonly placeholder?: string;
  readonly label?: string;
  readonly id?: string;
  readonly className?: string;
  readonly disabled?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
  readonly onBlur?: () => void;
  readonly 'data-testid'?: string;
}

/**
 * NumberInput - Unified number input component
 *
 * Consolidates two previous implementations:
 * - UI version: supports min/max/precision/size
 * - Shared version: supports label/id/onBlur
 *
 * Now supports all features in a single component.
 */
function NumberInput({
  value,
  onChange,
  min,
  max,
  step,
  precision = DEFAULT_PRECISION,
  placeholder,
  label,
  id,
  className = '',
  disabled = false,
  size = 'md',
  onBlur,
  'data-testid': dataTestId,
}: Readonly<NumberInputProps>) {
  // If step is provided but not precision, derive precision from step
  const effectivePrecision =
    precision ?? (step ? Math.max(0, -Math.log10(step)) : DEFAULT_PRECISION);

  // If label is provided, we need to wrap it with a label element
  // Otherwise, just use TahoeNumberInput directly
  const inputElement = (
    <TahoeNumberInput
      value={value}
      onChange={onChange}
      {...(min !== undefined && { min })}
      {...(max !== undefined && { max })}
      precision={effectivePrecision}
      {...(placeholder && { placeholder: label || placeholder })}
      className={className}
      disabled={disabled}
      size={size}
      {...(onBlur && { onBlur })}
      {...(id && { 'data-id': id })}
      {...(dataTestId && { 'data-testid': dataTestId })}
    />
  );

  if (label || id) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        {id ? <div id={id}>{inputElement}</div> : inputElement}
      </div>
    );
  }

  return inputElement;
}

export default NumberInput;
