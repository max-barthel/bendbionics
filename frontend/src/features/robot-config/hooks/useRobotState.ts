import { DEFAULT_BACKBONE_LENGTH, DEFAULT_COUPLING_LENGTH } from '@/constants/app';
import { useLocalStorage } from '@/features/shared';
import type { RobotState } from '@/types/robot';
import { useCallback } from 'react';

const DEFAULT_ROBOT_STATE: RobotState = {
  segments: 5,
  bendingAngles: [0, 0, 0, 0, 0],
  rotationAngles: [0, 0, 0, 0, 0],
  backboneLengths: [
    DEFAULT_BACKBONE_LENGTH,
    DEFAULT_BACKBONE_LENGTH,
    DEFAULT_BACKBONE_LENGTH,
    DEFAULT_BACKBONE_LENGTH,
    DEFAULT_BACKBONE_LENGTH,
  ],
  couplingLengths: [
    DEFAULT_COUPLING_LENGTH,
    DEFAULT_COUPLING_LENGTH,
    DEFAULT_COUPLING_LENGTH,
    DEFAULT_COUPLING_LENGTH,
    DEFAULT_COUPLING_LENGTH,
    DEFAULT_COUPLING_LENGTH,
  ],
  discretizationSteps: 1000,
  tendonConfig: {
    count: 3,
    radius: 0.01,
  },
};

export function useRobotState() {
  // Use useLocalStorage hook instead of manual useEffect sync
  const [state, setState] = useLocalStorage<RobotState>('robotState', DEFAULT_ROBOT_STATE);

  // Helper function to adjust a single array
  const adjustArray = <T>(
    currentArray: T[],
    targetLength: number,
    defaultValue: T
  ): T[] => {
    if (currentArray.length === targetLength) return currentArray;

    if (currentArray.length < targetLength) {
      const newElements = new Array(targetLength - currentArray.length).fill(
        defaultValue
      );
      return [...currentArray, ...newElements];
    }

    return currentArray.slice(0, targetLength);
  };

  // Function to adjust arrays based on segment count
  const adjustArraysForSegments = (
    segments: number,
    currentState: RobotState
  ): Partial<RobotState> => {
    const backboneCount = segments;
    const couplingCount = segments + 1;

    const updates: Partial<RobotState> = {};

    // Adjust all arrays using the helper function
    updates.bendingAngles = adjustArray(currentState.bendingAngles, backboneCount, 0);
    updates.rotationAngles = adjustArray(currentState.rotationAngles, backboneCount, 0);
    updates.backboneLengths = adjustArray(
      currentState.backboneLengths,
      backboneCount,
      0.07
    );
    updates.couplingLengths = adjustArray(
      currentState.couplingLengths,
      couplingCount,
      0.03
    );

    return updates;
  };

  const setStateWithValidation = useCallback(
    (newState: RobotState | ((prev: RobotState) => RobotState)) => {
      setState(prevState => {
        const updatedState =
          typeof newState === 'function' ? newState(prevState) : newState;
        // State update in progress

        // Ensure all arrays exist before adjusting
        const completeState = {
          ...prevState,
          ...updatedState,
          bendingAngles: updatedState.bendingAngles || prevState.bendingAngles,
          rotationAngles: updatedState.rotationAngles || prevState.rotationAngles,
          backboneLengths: updatedState.backboneLengths || prevState.backboneLengths,
          couplingLengths: updatedState.couplingLengths || prevState.couplingLengths,
        };

        // Validate segments range
        const validatedSegments = Math.max(1, Math.min(10, completeState.segments));

        // If segments changed, adjust the arrays accordingly
        if (validatedSegments !== prevState.segments) {
          // Segments changed, adjusting arrays
          const arrayUpdates = adjustArraysForSegments(
            validatedSegments,
            completeState
          );
          const finalState = {
            ...completeState,
            segments: validatedSegments,
            ...arrayUpdates,
          };
          // Final state prepared
          return finalState;
        }

        // No segment change, returning complete state
        return completeState;
      });
    },
    []
  );

  return [state, setStateWithValidation] as const;
}
