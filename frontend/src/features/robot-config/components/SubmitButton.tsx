import { PrimaryButton } from '../../../components/ui';
import { combineStyles } from '../../../styles/tahoe-utils';

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
    <PrimaryButton
      data-testid="submit-button"
      aria-label={loading ? 'computing' : 'compute'}
      onClick={onClick}
      disabled={disabled || loading}
      className={combineStyles(
        'w-full max-w-xs px-4 py-2 justify-center',
        loading ? 'scale-[0.98]' : ''
      )}
    >
      <span className="text-sm font-medium text-gray-900">
        {loading ? 'Processing...' : 'Compute'}
      </span>
    </PrimaryButton>
  );
}

export default SubmitButton;
