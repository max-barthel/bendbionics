interface UnitSelectorProps<T extends string> {
  units: readonly T[];
  selectedUnit: T;
  onUnitChange: (unit: T) => void;
  className?: string;
  ariaLabel?: string;
}

export function UnitSelector<T extends string>({
  units,
  selectedUnit,
  onUnitChange,
  className = "",
  ariaLabel,
}: UnitSelectorProps<T>) {
  return (
    <div
      className={`flex bg-white/10 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-2xl shadow-black/5 ${className}`}
      // Advanced frosted glass effects require inline styles for complex gradients and shadows
      style={{
        background:
          "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
    >
      {units.map((unit) => (
        <button
          key={unit}
          onClick={() => onUnitChange(unit)}
          className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-300 ease-out ${
            selectedUnit === unit
              ? "bg-gradient-to-r from-blue-500/30 to-indigo-500/30 text-gray-900 shadow-lg border border-blue-400/30"
              : "text-gray-600 hover:text-gray-800 hover:bg-white/20"
          }`}
          // Advanced selected state styling with complex gradients and shadows
          style={{
            width: "2.5rem", // Fixed width to prevent layout shift
            height: "1.75rem", // Fixed height to prevent layout shift
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...(selectedUnit === unit && {
              background:
                "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)",
              boxShadow:
                "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
              border: "1px solid rgba(59,130,246,0.3)",
            }),
          }}
          aria-label={
            ariaLabel ? `${ariaLabel} unit ${unit}` : `Select ${unit} unit`
          }
        >
          {unit}
          {selectedUnit === unit && (
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              // Frosted glass highlight overlay for selected state
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
