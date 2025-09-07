import React, { useEffect, useState } from "react";
import type { TendonConfig } from "../api/client";
import {
  SliderInput,
  SubsectionTitle,
  TahoeNumberInput,
  UnitSelector,
} from "./ui";

interface TendonConfigPanelProps {
  tendonConfig: TendonConfig;
  onConfigChange: (config: TendonConfig) => void;
  className?: string;
}

export const TendonConfigPanel: React.FC<TendonConfigPanelProps> = ({
  tendonConfig,
  onConfigChange,
  className = "",
}) => {
  const [localConfig, setLocalConfig] = useState<TendonConfig>(tendonConfig);
  const [radiusUnit, setRadiusUnit] = useState<"mm" | "cm" | "m">("mm");
  const [offsetUnit, setOffsetUnit] = useState<"mm" | "cm" | "m">("mm");
  const lengthUnits = ["mm", "cm", "m"] as const;

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
  const convertToSI = (value: number, unit: "mm" | "cm" | "m") => {
    switch (unit) {
      case "mm":
        return value / 1000;
      case "cm":
        return value / 100;
      case "m":
        return value;
      default:
        return value;
    }
  };

  const convertFromSI = (value: number, unit: "mm" | "cm" | "m") => {
    switch (unit) {
      case "mm":
        return value * 1000;
      case "cm":
        return value * 100;
      case "m":
        return value;
      default:
        return value;
    }
  };

  const handleRadiusChange = (value: number) => {
    const siValue = convertToSI(value, radiusUnit);
    handleConfigChange("radius", siValue);
  };

  const handleOffsetChange = (value: number) => {
    const siValue = convertToSI(value, offsetUnit);
    handleConfigChange("coupling_offset", siValue);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Tendon Count - using SliderInput like basic tab */}
      <div className="space-y-3">
        <SubsectionTitle
          title="Tendon Count"
          description="Number of tendons (3-12)"
        />
        <SliderInput
          value={localConfig.count}
          onChange={(value) => handleConfigChange("count", value)}
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
            <TahoeNumberInput
              value={Number(
                convertFromSI(localConfig.radius, radiusUnit).toFixed(4)
              )}
              onChange={handleRadiusChange}
              min={convertToSI(0.005, radiusUnit)}
              max={convertToSI(0.025, radiusUnit)}
              step={convertToSI(0.001, radiusUnit)}
              placeholder="Radius"
              className="flex-1"
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
            <TahoeNumberInput
              value={Number(
                convertFromSI(localConfig.coupling_offset, offsetUnit).toFixed(
                  4
                )
              )}
              onChange={handleOffsetChange}
              min={convertToSI(-0.01, offsetUnit)}
              max={convertToSI(0.01, offsetUnit)}
              step={convertToSI(0.001, offsetUnit)}
              placeholder="Offset"
              className="flex-1"
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
