import { useEffect } from "react";
import { Card, SliderInput } from "../../../components/ui";
import { useFormSubmission } from "../hooks/useFormSubmission";
import { useRobotState, type RobotState } from "../hooks/useRobotState";
import ArrayInputGroup from "./ArrayInputGroup";
import {
  FormActions,
  FormErrorDisplay,
  FormHeader,
  RobotStructureInfo,
} from "./forms";

type FormProps = {
  onResult: (
    segments: number[][][],
    configuration: Record<string, any>
  ) => void;
  initialConfiguration?: Record<string, any>;
};

// Error types are now handled by the useFormSubmission hook

function Form({ onResult, initialConfiguration }: FormProps) {
  const [robotState, setRobotState] = useRobotState();

  // Use the unified form submission hook
  const {
    loading,
    validating,
    computationProgress,
    error,
    handleSubmit,
    hideError,
  } = useFormSubmission({
    onResult: (result) => onResult(result.segments, result.configuration),
  });

  // Load initial configuration if provided
  useEffect(() => {
    if (initialConfiguration) {
      const config = initialConfiguration;
      setRobotState({
        segments: config.segments || 5,
        bendingAngles: config.bendingAngles || [
          0.628319, 0.628319, 0.628319, 0.628319, 0.628319,
        ],
        rotationAngles: config.rotationAngles || [0, 0, 0, 0, 0],
        backboneLengths: config.backboneLengths || [
          0.07, 0.07, 0.07, 0.07, 0.07,
        ],
        couplingLengths: config.couplingLengths || [
          0.03, 0.03, 0.03, 0.03, 0.03, 0.03,
        ],
        discretizationSteps: config.discretizationSteps || 1000,
      });
    }
    // If no initialConfiguration is provided, the useRobotState hook will use its own defaults
  }, [initialConfiguration]); // Removed setRobotState from dependencies

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => ({ ...prev, ...updates }));
  };

  // The handleSubmit function is now provided by the useFormSubmission hook

  return (
    <>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col space-y-6"
        >
          <FormHeader title="Soft Robot Parameters" isValidating={validating} />

          <FormErrorDisplay error={error} onClose={hideError} />

          <div className="space-y-2">
            <SliderInput
              label="Segments"
              value={robotState.segments}
              onChange={(segments: number) => updateRobotState({ segments })}
              min={1}
              max={10}
              step={1}
              placeholder="Segments"
            />
            <RobotStructureInfo segments={robotState.segments} />
          </div>

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
            onChange={(backboneLengths) =>
              updateRobotState({ backboneLengths })
            }
            mode="length"
          />

          <ArrayInputGroup
            label="Coupling Lengths"
            values={robotState.couplingLengths}
            onChange={(couplingLengths) =>
              updateRobotState({ couplingLengths })
            }
            mode="length"
          />

          <SliderInput
            label="Discretization Steps"
            value={robotState.discretizationSteps}
            onChange={(discretizationSteps: number) =>
              updateRobotState({ discretizationSteps })
            }
            min={100}
            max={5000}
            step={100}
            placeholder="Steps"
          />

          <FormActions onSubmit={handleSubmit} loading={loading} />
        </form>
      </Card>
    </>
  );
}

export default Form;
