import { useEffect, useState } from 'react';

export interface RobotState {
  segments: number;
  bendingAngles: number[];
  rotationAngles: number[];
  backboneLengths: number[];
  couplingLengths: number[];
  discretizationSteps: number;
}

export function useRobotState() {
  const [state, setState] = useState<RobotState>(() => {
    const saved = localStorage.getItem('robotState');
    return saved ? JSON.parse(saved) : {
      segments: 5,
      bendingAngles: [0.628319, 0.628319, 0.628319, 0.628319, 0.628319],
      rotationAngles: [0, 0, 0, 0, 0],
      backboneLengths: [0.07, 0.07, 0.07, 0.07, 0.07],
      couplingLengths: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
      discretizationSteps: 1000
    };
  });

  // Function to adjust arrays based on segment count
  // This ensures the robot parameters match the selected number of segments
  const adjustArraysForSegments = (segments: number, currentState: RobotState): Partial<RobotState> => {
    // Each segment consists of one backbone and one coupling
    // The base coupling is always present, so we have segments + 1 couplings total
    const backboneCount = segments; // Each segment has one backbone
    const couplingCount = segments + 1; // Couplings are one more than backbones (includes base coupling)

    // Default values for new elements
    const defaultBendingAngle = 0; // in radians
    const defaultRotationAngle = 0; // in radians
    const defaultBackboneLength = 0; // in meters
    const defaultCouplingLength = 0; // in meters

    const updates: Partial<RobotState> = {};

    // Adjust bending angles
    if (currentState.bendingAngles.length !== backboneCount) {
      if (currentState.bendingAngles.length < backboneCount) {
        // Add new elements
        const newElements = Array(backboneCount - currentState.bendingAngles.length)
          .fill(defaultBendingAngle);
        updates.bendingAngles = [...currentState.bendingAngles, ...newElements];
      } else {
        // Remove excess elements
        updates.bendingAngles = currentState.bendingAngles.slice(0, backboneCount);
      }
    }

    // Adjust rotation angles
    if (currentState.rotationAngles.length !== backboneCount) {
      if (currentState.rotationAngles.length < backboneCount) {
        // Add new elements
        const newElements = Array(backboneCount - currentState.rotationAngles.length)
          .fill(defaultRotationAngle);
        updates.rotationAngles = [...currentState.rotationAngles, ...newElements];
      } else {
        // Remove excess elements
        updates.rotationAngles = currentState.rotationAngles.slice(0, backboneCount);
      }
    }

    // Adjust backbone lengths
    if (currentState.backboneLengths.length !== backboneCount) {
      if (currentState.backboneLengths.length < backboneCount) {
        // Add new elements
        const newElements = Array(backboneCount - currentState.backboneLengths.length)
          .fill(defaultBackboneLength);
        updates.backboneLengths = [...currentState.backboneLengths, ...newElements];
      } else {
        // Remove excess elements
        updates.backboneLengths = currentState.backboneLengths.slice(0, backboneCount);
      }
    }

    // Adjust coupling lengths
    if (currentState.couplingLengths.length !== couplingCount) {
      if (currentState.couplingLengths.length < couplingCount) {
        // Add new elements
        const newElements = Array(couplingCount - currentState.couplingLengths.length)
          .fill(defaultCouplingLength);
        updates.couplingLengths = [...currentState.couplingLengths, ...newElements];
      } else {
        // Remove excess elements
        updates.couplingLengths = currentState.couplingLengths.slice(0, couplingCount);
      }
    }

    return updates;
  };

  const setStateWithValidation = (newState: RobotState | ((prev: RobotState) => RobotState)) => {
    setState((prevState) => {
      const updatedState = typeof newState === 'function' ? newState(prevState) : newState;

      // If segments changed, adjust the arrays accordingly
      if (updatedState.segments !== prevState.segments) {
        const arrayUpdates = adjustArraysForSegments(updatedState.segments, updatedState);
        return { ...updatedState, ...arrayUpdates };
      }

      return updatedState;
    });
  };

  useEffect(() => {
    localStorage.setItem('robotState', JSON.stringify(state));
  }, [state]);

  return [state, setStateWithValidation] as const;
}
