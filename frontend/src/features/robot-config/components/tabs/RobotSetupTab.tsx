import {
  AdvancedIcon,
  LightningIcon,
  RobotIcon,
  TendonIcon,
  UploadIcon,
} from '@/components/icons';
import { Button, SliderInput, SubsectionTitle, Typography } from '@/components/ui';
import ArrayInputGroup from '@/features/robot-config/components/ArrayInputGroup';
import { CollapsibleSection } from '@/features/shared/components/CollapsibleSection';
import { TendonConfigPanel } from '@/features/visualization/components/TendonConfigPanel';
import { buttonVariants } from '@/styles/design-tokens';
import type { RobotState } from '@/types/robot';
import React, { useState } from 'react';

interface RobotSetupTabProps {
  onShowPresetManager?: () => void;
  robotState: RobotState;
  setRobotState: (state: RobotState | ((prev: RobotState) => RobotState)) => void;
  onFieldCommit?: () => void;
}

export const RobotSetupTab: React.FC<RobotSetupTabProps> = ({
  onShowPresetManager,
  robotState,
  setRobotState,
  onFieldCommit,
}) => {
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showBasicSettings, setShowBasicSettings] = useState(true);
  const [showLengthSettings, setShowLengthSettings] = useState(true);
  const [showTendonSettings, setShowTendonSettings] = useState(true);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState(prev => ({ ...prev, ...updates }));
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
        <Button
          variant="primary"
          onClick={() => onShowPresetManager?.()}
          className="w-full mt-6 px-4 py-2 justify-center"
        >
          <div className="flex items-center justify-center gap-2">
            <UploadIcon className="w-4 h-4" />
            <span className={buttonVariants.primaryText}>Preset Manager</span>
          </div>
        </Button>
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
            {...(onFieldCommit && { onBlur: onFieldCommit })}
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
              className="text-gray-500 text-xs wrap-break-words mb-2"
            >
              Adjust the height for each backbone
            </Typography>
            <ArrayInputGroup
              label=""
              values={robotState.backboneLengths}
              onChange={backboneLengths => updateRobotState({ backboneLengths })}
              mode="length"
              {...(onFieldCommit && { onFieldCommit })}
            />
          </div>

          <div>
            <SubsectionTitle title="Coupling Lengths" />
            <Typography
              variant="caption"
              className="text-gray-500 text-xs wrap-break-words mb-2"
            >
              Adjust the height for each coupling
            </Typography>
            <ArrayInputGroup
              label=""
              values={robotState.couplingLengths}
              onChange={couplingLengths => updateRobotState({ couplingLengths })}
              mode="length"
              {...(onFieldCommit && { onFieldCommit })}
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
            robotState.tendonConfig ?? {
              count: 3,
              radius: 0.01,
            }
          }
          onConfigChange={tendonConfig => updateRobotState({ tendonConfig })}
          {...(onFieldCommit && { onFieldCommit })}
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
            {...(onFieldCommit && { onBlur: onFieldCommit })}
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
