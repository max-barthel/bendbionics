import React, { useState } from 'react';
import { BendingIcon, RotationIcon, UploadIcon } from '@/components/icons';
import { PrimaryButton, Typography } from '@/components/ui';
import { AngleControlPanel } from '@/features/shared/components/AngleControlPanel';
import { CollapsibleSection } from '@/features/shared/components/CollapsibleSection';
import type { RobotState } from '@/types/robot';

interface ControlTabProps {
  onShowPresetManager?: () => void;
  robotState: RobotState;
  setRobotState: (state: RobotState | ((prev: RobotState) => RobotState)) => void;
  onFieldCommit?: () => void;
}

export const ControlTab: React.FC<ControlTabProps> = ({
  onShowPresetManager,
  robotState,
  setRobotState,
  onFieldCommit,
}) => {
  const [showBendingSettings, setShowBendingSettings] = useState(true);
  const [showRotationSettings, setShowRotationSettings] = useState(true);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState(prev => {
      return { ...prev, ...updates };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center pb-4 border-b border-white/30">
        <Typography variant="h4" color="primary" className="mb-2">
          Robot Control
        </Typography>
        <Typography variant="body" color="gray" className="text-sm mb-12">
          Adjust angles to control movement
        </Typography>
        <PrimaryButton
          onClick={() => onShowPresetManager?.()}
          className="w-full mt-6 px-4 py-2 justify-center"
        >
          <div className="flex items-center justify-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Preset Manager
          </div>
        </PrimaryButton>
      </div>

      {/* Bending Angles - Main Control */}
      <CollapsibleSection
        title="Bending Angles"
        isOpen={showBendingSettings}
        onToggle={() => setShowBendingSettings(!showBendingSettings)}
        icon={<BendingIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-orange-500 to-red-600"
      >
        <AngleControlPanel
          values={robotState.bendingAngles}
          onChange={bendingAngles => updateRobotState({ bendingAngles })}
          {...(onFieldCommit && { onFieldCommit })}
        />
      </CollapsibleSection>

      {/* Rotation Angles */}
      <CollapsibleSection
        title="Rotation Angles"
        isOpen={showRotationSettings}
        onToggle={() => setShowRotationSettings(!showRotationSettings)}
        icon={<RotationIcon className="w-4 h-4 text-white" />}
        iconBg="bg-gradient-to-r from-yellow-500 to-amber-600"
      >
        <AngleControlPanel
          values={robotState.rotationAngles}
          onChange={rotationAngles => updateRobotState({ rotationAngles })}
          {...(onFieldCommit && { onFieldCommit })}
        />
      </CollapsibleSection>
    </div>
  );
};
