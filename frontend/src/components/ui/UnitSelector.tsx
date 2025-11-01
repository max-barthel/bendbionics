import { unitSelectorVariants } from '@/styles/design-tokens';
import { combineStyles } from '@/styles/tahoe-utils';

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
    <div className={combineStyles(unitSelectorVariants.container, className)}>
      {units.map(unit => (
        <button
          key={unit}
          onClick={() => onUnitChange(unit)}
          className={
            selectedUnit === unit
              ? unitSelectorVariants.buttonSelected
              : unitSelectorVariants.buttonUnselected
          }
          aria-label={ariaLabel ? `${ariaLabel} unit ${unit}` : `Select ${unit} unit`}
        >
          {unit}
          {selectedUnit === unit && (
            <div className={unitSelectorVariants.buttonSelectedOverlay} />
          )}
        </button>
      ))}
    </div>
  );
}
