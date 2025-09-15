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
      className={`w-full max-w-xs px-4 py-2 backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 rounded-full relative ${
        loading ? "scale-[0.98]" : "hover:scale-105"
      }`}
      style={{
        background:
          "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)",
        boxShadow:
          "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
      }}
    >
      <span className="text-sm font-medium text-gray-900">
        {loading ? "Processing..." : "Compute"}
      </span>
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      />
    </button>
  );
}

export default SubmitButton;
