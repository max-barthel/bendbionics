import React, { useState } from "react";
import { type RobotState } from "../../hooks/useRobotState";
import { AngleControlPanel } from "../AngleControlPanel";
import { CollapsibleSection } from "../CollapsibleSection";
import { BendingIcon, RotationIcon, UploadIcon } from "../icons";
import { Typography } from "../ui";

interface ControlTabProps {
  user?: any;
  onShowPresetManager?: () => void;
  robotState: RobotState;
  setRobotState: (
    state: RobotState | ((prev: RobotState) => RobotState)
  ) => void;
}

export const ControlTab: React.FC<ControlTabProps> = ({
  user,
  onShowPresetManager,
  robotState,
  setRobotState,
}) => {
  const [showBendingSettings, setShowBendingSettings] = useState(true);
  const [showRotationSettings, setShowRotationSettings] = useState(true);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => {
      const newState = { ...prev, ...updates };
      return newState;
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
        <button
          onClick={() => onShowPresetManager?.()}
          className="w-full mt-6 px-4 py-2 bg-white/20 backdrop-blur-xl text-gray-800 text-sm font-medium border border-white/30 shadow-2xl hover:bg-white/30 hover:shadow-2xl transition-all duration-300 rounded-full hover:scale-105"
        >
          <div className="flex items-center justify-center gap-2">
            <UploadIcon className="w-4 h-4" />
            Preset Manager
          </div>
        </button>
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
          onChange={(bendingAngles) => updateRobotState({ bendingAngles })}
          label="Bending Angles"
          mode="bending"
          icon={<BendingIcon className="w-4 h-4 text-white" />}
          iconBg="bg-gradient-to-r from-orange-500 to-red-600"
          description="How much each segment bends"
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
          onChange={(rotationAngles) => updateRobotState({ rotationAngles })}
          label="Rotation Angles"
          mode="rotation"
          icon={<RotationIcon className="w-4 h-4 text-white" />}
          iconBg="bg-gradient-to-r from-yellow-500 to-amber-600"
          description="Rotation around each segment's axis"
        />
      </CollapsibleSection>
    </div>
  );
};
