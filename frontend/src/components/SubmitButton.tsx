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
      size="lg"
      onClick={onClick}
      disabled={disabled}
      loading={loading}
      className={`w-full max-w-xs transition-all duration-200 ${
        loading ? "shadow-lg scale-[0.98]" : "hover:scale-[1.02]"
      }`}
    >
      {loading ? "Computing..." : "Compute"}
    </Button>
  );
}

export default SubmitButton;
