/**
 * Computation Helpers
 *
 * Utility functions for robot configuration computation and result processing.
 * Extracted from FormTabs component for better organization and reusability.
 */

import { robotAPI, type PCCParams } from '@/api/client';
import type { RobotConfiguration, RobotState } from '@/types/robot';
import { isApiResponseWithResult } from '@/utils/typeGuards';

/**
 * Create PCC parameters from robot state
 */
export function createPCCParams(robotState: RobotState): PCCParams {
  return {
    bending_angles: robotState.bendingAngles,
    rotation_angles: robotState.rotationAngles,
    backbone_lengths: robotState.backboneLengths,
    coupling_lengths: robotState.couplingLengths,
    discretization_steps: robotState.discretizationSteps,
    ...(robotState.tendonConfig && { tendon_config: robotState.tendonConfig }),
  };
}

/**
 * Create base robot configuration from robot state
 */
export function createBaseConfiguration(
  robotState: RobotState
): Omit<RobotConfiguration, 'tendonAnalysis'> {
  return {
    segments: robotState.segments,
    bendingAngles: robotState.bendingAngles,
    rotationAngles: robotState.rotationAngles,
    backboneLengths: robotState.backboneLengths,
    couplingLengths: robotState.couplingLengths,
    discretizationSteps: robotState.discretizationSteps,
    ...(robotState.tendonConfig && { tendonConfig: robotState.tendonConfig }),
  };
}

/**
 * Extract tendon analysis data from API response
 */
export function extractTendonAnalysis(result: unknown) {
  if (!isApiResponseWithResult(result)) return undefined;

  const { actuation_commands, coupling_data, tendon_analysis } = result.data.result;

  if (!actuation_commands || !coupling_data || !tendon_analysis) return undefined;

  return {
    actuation_commands: actuation_commands as Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >,
    coupling_data: coupling_data as {
      positions: number[][];
      orientations: number[][][];
    },
    tendon_analysis: tendon_analysis as {
      routing_points: number[][][];
      segment_lengths: number[][];
      total_lengths: number[][];
      length_changes: number[][];
      segment_length_changes: number[][];
    },
  };
}

/**
 * Handle tendon computation and process results
 */
export async function handleTendonComputation(
  params: PCCParams,
  robotState: RobotState,
  onResult: (segments: number[][][], configuration: RobotConfiguration) => void
): Promise<void> {
  const result = await robotAPI.computePCCWithTendons(params);
  const segments = isApiResponseWithResult(result)
    ? result.data.result.robot_positions
    : [];
  const tendonAnalysis = extractTendonAnalysis(result);

  const configuration: RobotConfiguration = {
    ...createBaseConfiguration(robotState),
    ...(tendonAnalysis && { tendonAnalysis }),
  };

  onResult(segments, configuration);
}

/**
 * Handle regular PCC computation (without tendons)
 */
export async function handleRegularComputation(
  params: PCCParams,
  robotState: RobotState,
  onResult: (segments: number[][][], configuration: RobotConfiguration) => void
): Promise<void> {
  const result = await robotAPI.computePCC(params);
  const configuration = createBaseConfiguration(robotState);
  onResult(result.data.segments || [], configuration);
}
