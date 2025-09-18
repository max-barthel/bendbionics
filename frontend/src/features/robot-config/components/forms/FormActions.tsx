import SubmitButton from "../SubmitButton";

interface FormActionsProps {
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
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
}: FormActionsProps) {
  return (
    <div>
      <SubmitButton onClick={onSubmit} loading={loading} disabled={disabled} />
    </div>
  );
}
