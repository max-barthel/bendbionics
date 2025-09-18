import React, { useState } from "react";
import {
  AdvancedIcon,
  LightningIcon,
  RobotIcon,
  TendonIcon,
  UploadIcon,
} from "../../../../components/icons";
import {
  SliderInput,
  SubsectionTitle,
  Typography,
} from "../../../../components/ui";
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection";
import { TendonConfigPanel } from "../../../visualization/components/TendonConfigPanel";
import { type RobotState } from "../../hooks/useRobotState";
import ArrayInputGroup from "../ArrayInputGroup";

interface RobotSetupTabProps {
  onShowPresetManager?: () => void;
  robotState: RobotState;
  setRobotState: (
    state: RobotState | ((prev: RobotState) => RobotState)
  ) => void;
}

export const RobotSetupTab: React.FC<RobotSetupTabProps> = ({
  onShowPresetManager,
  robotState,
  setRobotState,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showBasicSettings, setShowBasicSettings] = useState(true);
  const [showLengthSettings, setShowLengthSettings] = useState(true);
  const [showTendonSettings, setShowTendonSettings] = useState(true);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/30">
        <Typography variant="h4" color="primary" className="mb-2">
          Robot Setup
        </Typography>
        <Typography variant="body" color="gray" className="text-sm mb-12">
          Configure your robot's structure once.
          <br />
          Then save as a preset.
        </Typography>
        <button
          onClick={() => onShowPresetManager?.()}
          className="w-full mt-6 px-4 py-2 backdrop-blur-xl text-gray-900 text-sm font-medium border border-blue-400/30 shadow-lg transition-all duration-300 rounded-full hover:scale-105 relative bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
        >
          <div className="flex items-center justify-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Preset Manager
          </div>
          <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
        </button>
      </div>

      {/* Segments - Most Important */}
      <CollapsibleSection
        title="Robot Segments"
        isOpen={showBasicSettings}
        onToggle={() => setShowBasicSettings(!showBasicSettings)}
        icon={<RobotIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-blue-500 to-indigo-600"
      >
        <div className="space-y-3">
          <SubsectionTitle
            title="Number of segments"
            description="Each segment has one backbone and one coupling, plus a base coupling"
          />
          <SliderInput
            value={robotState.segments}
            onChange={(segments: number) => updateRobotState({ segments })}
            min={1}
            max={10}
            step={1}
            placeholder="Segments"
            label=""
          />
        </div>
      </CollapsibleSection>

      {/* Lengths Section */}
      <CollapsibleSection
        title="Dimensions"
        isOpen={showLengthSettings}
        onToggle={() => setShowLengthSettings(!showLengthSettings)}
        icon={<LightningIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-green-500 to-emerald-600"
      >
        <div className="space-y-6">
          <div>
            <SubsectionTitle title="Backbone Lengths" />
            <Typography
              variant="caption"
              className="text-gray-500 text-xs break-words mb-2"
            >
              Adjust the height for each backbone
            </Typography>
            <ArrayInputGroup
              label=""
              values={robotState.backboneLengths}
              onChange={(backboneLengths) =>
                updateRobotState({ backboneLengths })
              }
              mode="length"
            />
          </div>

          <div>
            <SubsectionTitle title="Coupling Lengths" />
            <Typography
              variant="caption"
              className="text-gray-500 text-xs break-words mb-2"
            >
              Adjust the height for each coupling
            </Typography>
            <ArrayInputGroup
              label=""
              values={robotState.couplingLengths}
              onChange={(couplingLengths) =>
                updateRobotState({ couplingLengths })
              }
              mode="length"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Tendon Configuration */}
      <CollapsibleSection
        title="Tendons"
        isOpen={showTendonSettings}
        onToggle={() => setShowTendonSettings(!showTendonSettings)}
        icon={<TendonIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-purple-500 to-pink-600"
      >
        <TendonConfigPanel
          tendonConfig={
            robotState.tendonConfig || {
              count: 3,
              radius: 0.01,
              coupling_offset: 0.0,
            }
          }
          onConfigChange={(tendonConfig) => updateRobotState({ tendonConfig })}
        />
      </CollapsibleSection>

      {/* Advanced Settings - Collapsible */}
      <CollapsibleSection
        title="Advanced"
        isOpen={showAdvancedSettings}
        onToggle={() => setShowAdvancedSettings(!showAdvancedSettings)}
        icon={<AdvancedIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-indigo-500 to-purple-600"
      >
        <div className="space-y-3">
          <SubsectionTitle
            title="Discretization Steps"
            description="Higher = smoother curves, slower computation"
          />
          <SliderInput
            value={robotState.discretizationSteps}
            onChange={(discretizationSteps: number) =>
              updateRobotState({ discretizationSteps })
            }
            min={100}
            max={5000}
            step={100}
            placeholder="Steps"
            label=""
          />
        </div>
      </CollapsibleSection>
    </div>
  );
};
