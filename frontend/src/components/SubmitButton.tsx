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
  const isDisabled = disabled || loading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`px-4 py-2 rounded-md transition font-medium ${
        isDisabled
          ? "bg-neutral-400 text-white cursor-not-allowed"
          : "bg-black text-white hover:bg-neutral-800"
      }`}
    >
      {loading ? "Computing..." : "Compute"}
    </button>
  );
}

export default SubmitButton;
