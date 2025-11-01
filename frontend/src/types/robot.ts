// Robot State interface - represents the current state of robot configuration
export interface RobotState {
  segments: number;
  bendingAngles: number[];
  rotationAngles: number[];
  backboneLengths: number[];
  couplingLengths: number[];
  discretizationSteps: number;
  tendonConfig?: {
    count: number;
    radius: number;
  };
}

// Define robot configuration type
export interface RobotConfiguration extends Partial<RobotState> {
  tendonAnalysis?: {
    actuation_commands: Record<
      string,
      {
        length_change_m: number;
        pull_direction: string;
        magnitude: number;
      }
    >;
    coupling_data?: {
      positions: number[][];
      orientations: number[][][];
    };
    tendon_analysis?: {
      routing_points: number[][][];
      segment_lengths: number[][];
      total_lengths: number[][];
      length_changes: number[][];
      segment_length_changes: number[][];
    };
  };
}

// Re-export User type from API for convenience
export type { User } from '../api/auth';
