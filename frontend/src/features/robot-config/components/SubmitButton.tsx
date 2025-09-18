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
    <button
      data-testid="submit-button"
      aria-label={loading ? "computing" : "compute"}
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full max-w-xs px-4 py-2 backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 rounded-full relative bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20 ${
        loading ? "scale-[0.98]" : "hover:scale-105"
      }`}
    >
      <span className="text-sm font-medium text-gray-900">
        {loading ? "Processing..." : "Compute"}
      </span>
      <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
    </button>
  );
}

export default SubmitButton;
