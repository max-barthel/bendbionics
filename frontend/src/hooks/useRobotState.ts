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
      segments: 3,
      bendingAngles: [0.628319, 0.628319, 0.628319],
      rotationAngles: [1.0471975512, 1.0471975512, 1.0471975512],
      backboneLengths: [0.07, 0.07, 0.07],
      couplingLengths: [0.03, 0.03, 0.03, 0.015],
      discretizationSteps: 1000
    };
  });

  useEffect(() => {
    localStorage.setItem('robotState', JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
