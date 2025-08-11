import React, { useState } from "react";
import { robotAPI, type PCCParams } from "../api/client";
import { useRobotState, type RobotState } from "../hooks/useRobotState";
import ArrayInputGroup from "./ArrayInputGroup";
import Card from "./Card";
import NumberInput from "./NumberInput";
import SegmentSlider from "./SegmentSlider";
import SubmitButton from "./SubmitButton";

type FormProps = {
  onResult: React.Dispatch<React.SetStateAction<number[][][]>>;
};

function Form({ onResult }: FormProps) {
  const [robotState, setRobotState] = useRobotState();
  const [loading, setLoading] = useState(false);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const params: PCCParams = {
        bending_angles: robotState.bendingAngles,
        rotation_angles: robotState.rotationAngles,
        backbone_lengths: robotState.backboneLengths,
        coupling_lengths: robotState.couplingLengths,
        discretization_steps: robotState.discretizationSteps,
      };

      const result = await robotAPI.computePCC(params);
      onResult(result.segments);
    } catch (err) {
      console.error("Failed to submit:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex flex-col space-y-6"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-neutral-800">
          Soft Robot Parameters
        </h2>

        <SegmentSlider
          label="Segments"
          value={robotState.segments}
          onChange={(segments) => updateRobotState({ segments })}
        />

        <ArrayInputGroup
          label="Bending Angles"
          values={robotState.bendingAngles}
          onChange={(bendingAngles) => updateRobotState({ bendingAngles })}
          mode="angle"
        />

        <ArrayInputGroup
          label="Rotation Angles"
          values={robotState.rotationAngles}
          onChange={(rotationAngles) => updateRobotState({ rotationAngles })}
          mode="angle"
        />

        <ArrayInputGroup
          label="Backbone Lengths"
          values={robotState.backboneLengths}
          onChange={(backboneLengths) => updateRobotState({ backboneLengths })}
          mode="length"
        />

        <ArrayInputGroup
          label="Coupling Lengths"
          values={robotState.couplingLengths}
          onChange={(couplingLengths) => updateRobotState({ couplingLengths })}
          mode="length"
        />

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-neutral-700">
            Discretization Steps
          </label>
          <NumberInput
            value={robotState.discretizationSteps}
            onChange={(discretizationSteps) =>
              updateRobotState({ discretizationSteps })
            }
            placeholder="Discretization Steps"
            id="discretization"
          />
        </div>

        <div className="pt-2">
          <SubmitButton onClick={handleSubmit} loading={loading} />
        </div>
      </form>
    </Card>
  );
}

export default Form;
