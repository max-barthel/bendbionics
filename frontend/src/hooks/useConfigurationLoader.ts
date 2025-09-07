import { useEffect } from "react";
import { useRobotState } from "./useRobotState";

export const useConfigurationLoader = (
    initialConfiguration?: Record<string, any>
) => {
    const [, setRobotState] = useRobotState();

    useEffect(() => {
        if (
            initialConfiguration &&
            Object.keys(initialConfiguration).length > 0
        ) {
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
                tendonConfig: config.tendonConfig || {
                    count: 4,
                    radius: 0.01,
                    coupling_offset: 0.0,
                },
            });
        }
    }, [initialConfiguration, setRobotState]);
};
