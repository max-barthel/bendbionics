import { type RobotState } from "../features/robot-config/hooks/useRobotState";

export const validateRobotConfiguration = async (
    robotState: RobotState,
    showError: (type: "validation", message: string) => void
): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const backboneLengths = [
        robotState.bendingAngles.length,
        robotState.rotationAngles.length,
        robotState.backboneLengths.length,
    ];
    const couplingLength = robotState.couplingLengths.length;

    if (backboneLengths.some((length) => length === 0)) {
        showError(
            "validation",
            "All backbone parameter arrays must have at least one value."
        );
        return false;
    }

    if (couplingLength === 0) {
        showError(
            "validation",
            "Coupling lengths array must have at least one value."
        );
        return false;
    }

    if (new Set(backboneLengths).size > 1) {
        showError(
            "validation",
            "All backbone parameter arrays must have the same number of values."
        );
        return false;
    }

    const backboneLength = backboneLengths[0];
    if (couplingLength !== backboneLength + 1) {
        showError(
            "validation",
            `Coupling lengths array must have ${backboneLength + 1} values.`
        );
        return false;
    }

    if (robotState.discretizationSteps <= 0) {
        showError("validation", "Discretization steps must be greater than 0.");
        return false;
    }

    const allValues = [
        ...robotState.bendingAngles,
        ...robotState.rotationAngles,
        ...robotState.backboneLengths,
        ...robotState.couplingLengths,
    ];

    if (allValues.some((val) => isNaN(val) || !isFinite(val))) {
        showError("validation", "All parameter values must be valid numbers.");
        return false;
    }

    return true;
};
