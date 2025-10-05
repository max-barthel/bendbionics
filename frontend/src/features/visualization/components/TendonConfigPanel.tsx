import React, { useEffect, useState } from 'react';
import type { TendonConfig } from '../../../api/client';
import { SliderInput, SubsectionTitle, UnitSelector } from '../../../components/ui';
import NumberInput from '../../shared/components/NumberInput';

type LengthUnit = 'mm' | 'cm' | 'm';

interface TendonConfigPanelProps {
  tendonConfig: TendonConfig;
  onConfigChange: (config: TendonConfig) => void;
  className?: string;
}

export const TendonConfigPanel: React.FC<TendonConfigPanelProps> = ({
  tendonConfig,
  onConfigChange,
  className = '',
}) => {
  const [localConfig, setLocalConfig] = useState<TendonConfig>(tendonConfig);
  const [radiusUnit, setRadiusUnit] = useState<LengthUnit>('mm');
  const [offsetUnit, setOffsetUnit] = useState<LengthUnit>('mm');
  const lengthUnits: readonly LengthUnit[] = ['mm', 'cm', 'm'];

  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(tendonConfig);
  }, [tendonConfig]);

  const handleConfigChange = (field: keyof TendonConfig, value: number) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Unit conversion functions
  const convertToSI = (value: number, unit: LengthUnit) => {
    switch (unit) {
      case 'mm':
        return value / 1000;
      case 'cm':
        return value / 100;
      case 'm':
        return value;
      default:
        return value;
    }
  };

  const convertFromSI = (value: number, unit: LengthUnit) => {
    switch (unit) {
      case 'mm':
        return value * 1000;
      case 'cm':
        return value * 100;
      case 'm':
        return value;
      default:
        return value;
    }
  };

  const handleRadiusChange = (value: number) => {
    const siValue = convertToSI(value, radiusUnit);
    handleConfigChange('radius', siValue);
  };

  const handleOffsetChange = (value: number) => {
    const siValue = convertToSI(value, offsetUnit);
    handleConfigChange('coupling_offset', siValue);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tendon Count - using SliderInput like basic tab */}
      <div className="space-y-3">
        <SubsectionTitle title="Tendon Count" description="Number of tendons (3-12)" />
        <SliderInput
          value={localConfig.count}
          onChange={value => handleConfigChange('count', value)}
          min={3}
          max={12}
          step={1}
          label=""
          className="mt-2"
        />
      </div>

      {/* Radius - using ArrayInputGroup style with unit switching */}
      <div className="space-y-3">
        <SubsectionTitle
          title="Radius"
          description="Distance from center to tendon eyelets"
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <NumberInput
              value={convertFromSI(localConfig.radius, radiusUnit)}
              onChange={handleRadiusChange}
              placeholder="Radius"
            />
            <UnitSelector
              units={lengthUnits}
              selectedUnit={radiusUnit}
              onUnitChange={setRadiusUnit}
              ariaLabel="Radius"
            />
          </div>
        </div>
      </div>

      {/* Vertical Offset - using ArrayInputGroup style with unit switching */}
      <div className="space-y-3">
        <SubsectionTitle
          title="Vertical Offset"
          description="Vertical offset of eyelets from coupling center"
        />

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <NumberInput
              value={convertFromSI(localConfig.coupling_offset, offsetUnit)}
              onChange={handleOffsetChange}
              placeholder="Offset"
            />
            <UnitSelector
              units={lengthUnits}
              selectedUnit={offsetUnit}
              onUnitChange={setOffsetUnit}
              ariaLabel="Vertical Offset"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
