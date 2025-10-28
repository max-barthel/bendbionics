import { type RobotState } from '../features/robot-config/hooks/useRobotState';

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

// Define user type
export interface User {
  username: string;
}
