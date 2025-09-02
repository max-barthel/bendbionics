import React, { useEffect, useState } from "react";
import type { TendonConfig } from "../api/client";
import { SliderInput, Typography } from "./ui";

interface TendonConfigPanelProps {
  tendonConfig: TendonConfig;
  onConfigChange: (config: TendonConfig) => void;
  tendonResults?: {
    actuation_commands: Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >;
  };
  className?: string;
}

export const TendonConfigPanel: React.FC<TendonConfigPanelProps> = ({
  tendonConfig,
  onConfigChange,
  tendonResults,
  className = "",
}) => {
  const [localConfig, setLocalConfig] = useState<TendonConfig>(tendonConfig);
  const [radiusUnit, setRadiusUnit] = useState<"mm" | "cm" | "m">("mm");
  const [offsetUnit, setOffsetUnit] = useState<"mm" | "cm" | "m">("mm");

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
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <Typography variant="label" color="neutral" as="label">
            Tendon Count
          </Typography>
        </div>
        <SliderInput
          value={localConfig.count}
          onChange={(value) => handleConfigChange("count", value)}
          min={3}
          max={12}
          step={1}
          label=""
          className="mt-2"
        />
        <Typography variant="caption" className="text-gray-500">
          Number of tendons (3-12)
        </Typography>
      </div>

      {/* Radius - using ArrayInputGroup style with unit switching */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <Typography variant="label" color="neutral" as="label">
            Radius
          </Typography>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Typography variant="label" color="neutral" as="label">
                Distance from center to tendon eyelets
              </Typography>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["mm", "cm", "m"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setRadiusUnit(unit)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                    radiusUnit === unit
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <input
                type="number"
                value={Number(
                  convertFromSI(localConfig.radius, radiusUnit).toFixed(4)
                )}
                onChange={(e) =>
                  handleRadiusChange(parseFloat(e.target.value) || 0)
                }
                min={convertToSI(0.005, radiusUnit)}
                max={convertToSI(0.025, radiusUnit)}
                step={convertToSI(0.001, radiusUnit)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Radius"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vertical Offset - using ArrayInputGroup style with unit switching */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </div>
          <Typography variant="label" color="neutral" as="label">
            Vertical Offset
          </Typography>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Typography variant="label" color="neutral" as="label">
                Vertical offset of eyelets from coupling center
              </Typography>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(["mm", "cm", "m"] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setOffsetUnit(unit)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                    offsetUnit === unit
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {unit}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <input
                type="number"
                value={Number(
                  convertFromSI(
                    localConfig.coupling_offset,
                    offsetUnit
                  ).toFixed(4)
                )}
                onChange={(e) =>
                  handleOffsetChange(parseFloat(e.target.value) || 0)
                }
                min={convertToSI(-0.01, offsetUnit)}
                max={convertToSI(0.01, offsetUnit)}
                step={convertToSI(0.001, offsetUnit)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Offset"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tendon Results Section - Length Changes Only */}
      {tendonResults && tendonResults.actuation_commands && (
        <>
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <Typography variant="label" color="neutral" as="label">
                Tendon Length Changes (Δl)
              </Typography>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Object.entries(tendonResults.actuation_commands).map(
                ([tendonId, command]) => (
                  <div
                    key={tendonId}
                    className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/40 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-blue-900">
                        Tendon {tendonId}
                      </span>
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {(command.length_change_m * 1000).toFixed(2)} mm
                    </div>
                    <div className="text-xs text-blue-600/80">
                      {command.pull_direction}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
