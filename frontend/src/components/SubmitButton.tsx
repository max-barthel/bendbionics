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
      className={`px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/30 shadow-2xl hover:bg-white/30 hover:shadow-2xl transition-all duration-300 rounded-full ${
        loading ? "scale-[0.98]" : "hover:scale-105"
      }`}
    >
      {loading ? "Processing..." : "Compute"}
    </Button>
  );
}

export default SubmitButton;
