import { Button } from '@/components/ui';
import { cn } from '@/styles/tahoe-utils';

type SubmitButtonProps = {
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly loading?: boolean;
};

function SubmitButton({
  onClick,
  disabled = false,
  loading = false,
}: SubmitButtonProps) {
  return (
    <Button
      variant="primary"
      data-testid="submit-button"
      aria-label={loading ? 'computing' : 'compute'}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full max-w-xs px-4 py-2 justify-center',
        loading ? 'scale-[0.98]' : ''
      )}
    >
      <span className="text-sm font-medium text-gray-900">
        {loading ? 'Processing...' : 'Compute'}
      </span>
    </Button>
  );
}

export default SubmitButton;
