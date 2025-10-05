import { LoadingSpinner, Typography } from '../../../../components/ui';

interface FormHeaderProps {
  readonly title: string;
  readonly isValidating?: boolean;
}

/**
 * FormHeader - Displays the form title with optional validation status
 *
 * This component provides a consistent header for forms with validation feedback.
 */
export function FormHeader({ title, isValidating = false }: FormHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <Typography variant="h2" color="primary">
        {title}
      </Typography>
      {isValidating && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <LoadingSpinner size="sm" color="primary" />
          <span>Validating...</span>
        </div>
      )}
    </div>
  );
}
