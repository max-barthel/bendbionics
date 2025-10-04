interface UnitSelectorProps<T extends string> {
  readonly units: readonly T[];
  readonly selectedUnit: T;
  readonly onUnitChange: (unit: T) => void;
  readonly className?: string;
  readonly ariaLabel?: string;
}

export function UnitSelector<T extends string>({
  units,
  selectedUnit,
  onUnitChange,
  className = '',
  ariaLabel,
}: UnitSelectorProps<T>) {
  return (
    <div
      className={`flex bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-full p-1 shadow-2xl shadow-black/5 gap-1 ${className}`}
    >
      {units.map(unit => (
        <button
          key={unit}
          onClick={() => onUnitChange(unit)}
          className={`relative flex-1 h-7 px-3 flex items-center justify-center text-xs font-medium rounded-full transition-colors duration-200 border-2 ${
            selectedUnit === unit
              ? 'bg-blue-500/20 text-gray-900 border-blue-400/50'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/20 border-transparent'
          }`}
          aria-label={ariaLabel ? `${ariaLabel} unit ${unit}` : `Select ${unit} unit`}
        >
          {unit}
          {selectedUnit === unit && (
            <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
          )}
        </button>
      ))}
    </div>
  );
}
