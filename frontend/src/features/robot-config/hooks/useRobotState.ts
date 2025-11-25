import {
  DEFAULT_BACKBONE_LENGTH,
  DEFAULT_COUPLING_LENGTH,
  DEFAULT_TENDON_RADIUS,
} from '@/constants/app';
import { useLocalStorage } from '@/features/shared';
import type { RobotState } from '@/types/robot';
import { adjustArray } from '@/utils/array-helpers';
import { ensureValidTendonConfig, normalizeTendonRadius } from '@/utils/tendon-helpers';
import { useCallback, useEffect } from 'react';

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
    radius: [
      DEFAULT_TENDON_RADIUS,
      DEFAULT_TENDON_RADIUS,
      DEFAULT_TENDON_RADIUS,
      DEFAULT_TENDON_RADIUS,
      DEFAULT_TENDON_RADIUS,
      DEFAULT_TENDON_RADIUS,
    ],
  },
};

export function useRobotState() {
  // Use useLocalStorage hook instead of manual useEffect sync
  const [state, setState] = useLocalStorage<RobotState>(
    'robotState',
    DEFAULT_ROBOT_STATE
  );

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

    // Adjust tendon radius array (same length as coupling lengths)
    if (currentState.tendonConfig) {
      updates.tendonConfig = ensureValidTendonConfig(
        currentState.tendonConfig,
        couplingCount
      );
    }

    return updates;
  };

  const setStateWithValidation = useCallback(
    (newState: RobotState | ((prev: RobotState) => RobotState)) => {
      setState(prevState => {
        const updatedState =
          typeof newState === 'function' ? newState(prevState) : newState;
        // State update in progress

        // Ensure all arrays exist before adjusting
        const completeState: RobotState = {
          ...prevState,
          ...updatedState,
          bendingAngles: updatedState.bendingAngles || prevState.bendingAngles,
          rotationAngles: updatedState.rotationAngles || prevState.rotationAngles,
          backboneLengths: updatedState.backboneLengths || prevState.backboneLengths,
          couplingLengths: updatedState.couplingLengths || prevState.couplingLengths,
          ...(updatedState.tendonConfig || prevState.tendonConfig
            ? { tendonConfig: updatedState.tendonConfig || prevState.tendonConfig }
            : {}),
        };

        // Validate segments range
        const validatedSegments = Math.max(1, Math.min(10, completeState.segments));

        // Ensure tendonConfig.radius is always initialized
        const couplingCount = validatedSegments + 1;
        if (completeState.tendonConfig) {
          // Ensure radius array exists and is the correct size
          completeState.tendonConfig = ensureValidTendonConfig(
            completeState.tendonConfig,
            couplingCount
          );
        } else {
          // Initialize tendonConfig if missing
          completeState.tendonConfig = {
            count: 3,
            radius: normalizeTendonRadius(
              undefined,
              couplingCount,
              DEFAULT_TENDON_RADIUS
            ),
          };
        }

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
    [setState]
  );

  // Validate initial state on mount to ensure tendonConfig.radius is always initialized
  useEffect(() => {
    const couplingCount = state.segments + 1;
    const needsFix =
      !state.tendonConfig ||
      !Array.isArray(state.tendonConfig.radius) ||
      state.tendonConfig.radius.length !== couplingCount;

    if (needsFix) {
      setStateWithValidation(currentState => {
        const validatedSegments = Math.max(1, Math.min(10, currentState.segments));
        const validatedCouplingCount = validatedSegments + 1;

        if (!currentState.tendonConfig) {
          return {
            ...currentState,
            tendonConfig: {
              count: 3,
              radius: normalizeTendonRadius(
                undefined,
                validatedCouplingCount,
                DEFAULT_TENDON_RADIUS
              ),
            },
          };
        }

        return {
          ...currentState,
          tendonConfig: ensureValidTendonConfig(
            currentState.tendonConfig,
            validatedCouplingCount
          ),
        };
      });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [state, setStateWithValidation] as const;
}
