import Input from './Input';

type InputType = 'text' | 'number' | 'password' | 'email';

interface FormFieldProps {
  readonly id: string;
  readonly label: string;
  readonly type?: InputType;
  readonly value: string | number;
  readonly onChange: (value: string | number) => void;
  readonly placeholder?: string;
  readonly className?: string;
  readonly required?: boolean;
  readonly helperText?: string;
}

/**
 * FormField - Reusable form field component with label and input
 *
 * Extracted from LoginForm and RegisterForm to eliminate duplication
 * of the label + Input pattern.
 */
export function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  className = '',
  required = false,
  helperText,
}: Readonly<FormFieldProps>) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && ' *'}
      </label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        {...(placeholder && { placeholder })}
        className="w-full"
      />
      {helperText && <p className="text-xs text-gray-500 mt-1">{helperText}</p>}
    </div>
  );
}
