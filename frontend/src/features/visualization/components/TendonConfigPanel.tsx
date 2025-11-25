import { SliderInput, SubsectionTitle } from '@/components/ui';
import ArrayInputGroup from '@/features/robot-config/components/ArrayInputGroup';
import type { TendonConfig } from '@/types';
import { ensureValidTendonConfig } from '@/utils/tendon-helpers';
import React, { useEffect, useState } from 'react';

interface TendonConfigPanelProps {
  tendonConfig: TendonConfig;
  onConfigChange: (config: TendonConfig) => void;
  className?: string;
  onFieldCommit?: () => void;
  segments?: number;
}

export const TendonConfigPanel: React.FC<TendonConfigPanelProps> = ({
  tendonConfig,
  onConfigChange,
  className = '',
  onFieldCommit,
  segments,
}) => {
  const couplingCount = segments ? segments + 1 : tendonConfig.radius?.length || 6;

  const [localConfig, setLocalConfig] = useState<TendonConfig>(
    ensureValidTendonConfig(tendonConfig, couplingCount)
  );

  // Update local config when prop or segments change
  useEffect(() => {
    const validConfig = ensureValidTendonConfig(tendonConfig, couplingCount);
    const wasInvalid =
      !Array.isArray(tendonConfig.radius) ||
      tendonConfig.radius.length !== validConfig.radius.length;

    setLocalConfig(validConfig);

    // If the config was corrected, notify parent (only once to avoid loops)
    if (wasInvalid) {
      onConfigChange(validConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tendonConfig, segments]);

  const handleConfigChange = (field: keyof TendonConfig, value: number | number[]) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tendon Count - using SliderInput like basic tab */}
      <div className="space-y-3">
        <SubsectionTitle title="Tendon Count" description="Number of tendons (3-12)" />
        <SliderInput
          value={localConfig.count}
          onChange={value => handleConfigChange('count', value)}
          {...(onFieldCommit && { onBlur: onFieldCommit })}
          min={3}
          max={12}
          step={1}
          label=""
          className="mt-2"
        />
      </div>

      {/* Radius - using ArrayInputGroup like coupling lengths */}
      <div className="space-y-3">
        <SubsectionTitle
          title="Tendon Radii"
          description="Distance from center to tendon eyelets for each coupling"
        />
        <ArrayInputGroup
          label=""
          values={localConfig.radius}
          onChange={radius => handleConfigChange('radius', radius)}
          mode="length"
          {...(onFieldCommit && { onFieldCommit })}
        />
      </div>
    </div>
  );
};
