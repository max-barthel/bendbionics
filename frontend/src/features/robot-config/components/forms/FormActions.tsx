import SubmitButton from '@/features/robot-config/components/SubmitButton';

interface FormActionsProps {
  readonly onSubmit: () => void;
  readonly loading?: boolean;
  readonly disabled?: boolean;
}

/**
 * FormActions - Handles form submission actions
 *
 * This component provides consistent form action buttons across all forms.
 * It can be extended to include additional actions like reset, cancel, etc.
 */
export function FormActions({
  onSubmit,
  loading = false,
  disabled = false,
}: Readonly<FormActionsProps>) {
  return (
    <div>
      <SubmitButton onClick={onSubmit} loading={loading} disabled={disabled} />
    </div>
  );
}
