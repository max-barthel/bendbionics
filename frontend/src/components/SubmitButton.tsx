import { Button } from "./ui";

type SubmitButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function SubmitButton({
  onClick,
  disabled = false,
  loading = false,
}: SubmitButtonProps) {
  return (
    <Button
      variant="primary"
      size="md"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
    >
      {loading ? "Computing..." : "Compute"}
    </Button>
  );
}

export default SubmitButton;
