import { useEffect } from 'react';
import { Card, SliderInput } from '../../../components/ui';
import { DEFAULT_CONFIG } from '../../../constants/app';
import { useFormSubmission } from '../hooks/useFormSubmission';
import { useRobotState, type RobotState } from '../hooks/useRobotState';
import ArrayInputGroup from './ArrayInputGroup';
import { FormErrorDisplay, FormHeader, RobotStructureInfo } from './forms';

// Error types are now handled by the useFormSubmission hook

function Form({
  onResult,
  initialConfiguration,
}: {
  readonly onResult: (
    segments: number[][][],
    configuration: Record<string, unknown>
  ) => void;
  readonly initialConfiguration?: Record<string, unknown>;
}) {
  const [robotState, setRobotState] = useRobotState();

  // Use the unified form submission hook
  const { validating, error, handleSubmit, computeIfValid, hideError } =
    useFormSubmission({
      onResult: result => onResult(result.segments, result.configuration),
    });

  // Load initial configuration if provided
  useEffect(() => {
    if (initialConfiguration) {
      const config = initialConfiguration;
      setRobotState({
        segments: (config['segments'] as number) ?? DEFAULT_CONFIG.SEGMENTS,
        bendingAngles: (config['bendingAngles'] as number[]) ?? [
          DEFAULT_CONFIG.BENDING_ANGLE,
          DEFAULT_CONFIG.BENDING_ANGLE,
          DEFAULT_CONFIG.BENDING_ANGLE,
          DEFAULT_CONFIG.BENDING_ANGLE,
          DEFAULT_CONFIG.BENDING_ANGLE,
        ],
        rotationAngles: (config['rotationAngles'] as number[]) ?? [0, 0, 0, 0, 0],
        backboneLengths: (config['backboneLengths'] as number[]) ?? [
          DEFAULT_CONFIG.BACKBONE_LENGTH,
          DEFAULT_CONFIG.BACKBONE_LENGTH,
          DEFAULT_CONFIG.BACKBONE_LENGTH,
          DEFAULT_CONFIG.BACKBONE_LENGTH,
          DEFAULT_CONFIG.BACKBONE_LENGTH,
        ],
        couplingLengths: (config['couplingLengths'] as number[]) ?? [
          DEFAULT_CONFIG.COUPLING_LENGTH,
          DEFAULT_CONFIG.COUPLING_LENGTH,
          DEFAULT_CONFIG.COUPLING_LENGTH,
          DEFAULT_CONFIG.COUPLING_LENGTH,
          DEFAULT_CONFIG.COUPLING_LENGTH,
          DEFAULT_CONFIG.COUPLING_LENGTH,
        ],
        discretizationSteps:
          (config['discretizationSteps'] as number) ??
          DEFAULT_CONFIG.DISCRETIZATION_STEPS,
      });
      // After applying initial configuration, attempt auto-compute
      computeIfValid().catch(() => {
        // Silently handle errors - error state is managed by useFormSubmission
      });
    }
    // If no initialConfiguration is provided, the useRobotState hook will use its own defaults
  }, [initialConfiguration, setRobotState, computeIfValid]);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState(prev => ({ ...prev, ...updates }));
  };

  // The handleSubmit function is now provided by the useFormSubmission hook
  const onFieldCommit = () => {
    computeIfValid().catch(() => {
      // Silently handle errors - error state is managed by useFormSubmission
    });
  };

  return (
    <Card>
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit().catch(() => {
            // Silently handle errors - error state is managed by useFormSubmission
          });
        }}
        className="flex flex-col space-y-6"
      >
        <FormHeader title="Parameters" isValidating={validating} />

        <FormErrorDisplay error={error} onClose={hideError} />

        <div className="space-y-2">
          <SliderInput
            label="Segments"
            value={robotState.segments}
            onChange={(segments: number) => updateRobotState({ segments })}
            onBlur={onFieldCommit}
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
          onChange={bendingAngles => updateRobotState({ bendingAngles })}
          mode="angle"
          onFieldCommit={onFieldCommit}
        />

        <ArrayInputGroup
          label="Rotation Angles"
          values={robotState.rotationAngles}
          onChange={rotationAngles => updateRobotState({ rotationAngles })}
          mode="angle"
          onFieldCommit={onFieldCommit}
        />

        <ArrayInputGroup
          label="Backbone Lengths"
          values={robotState.backboneLengths}
          onChange={backboneLengths => updateRobotState({ backboneLengths })}
          mode="length"
          onFieldCommit={onFieldCommit}
        />

        <ArrayInputGroup
          label="Coupling Lengths"
          values={robotState.couplingLengths}
          onChange={couplingLengths => updateRobotState({ couplingLengths })}
          mode="length"
          onFieldCommit={onFieldCommit}
        />

        <SliderInput
          label="Discretization Steps"
          value={robotState.discretizationSteps}
          onChange={(discretizationSteps: number) =>
            updateRobotState({ discretizationSteps })
          }
          onBlur={onFieldCommit}
          min={100}
          max={5000}
          step={100}
          placeholder="Steps"
        />
      </form>
    </Card>
  );
}

export default Form;
