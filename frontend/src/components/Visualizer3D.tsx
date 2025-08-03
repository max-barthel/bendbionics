import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

type Visualizer3DProps = {
  segments: number[][][]; // Array of segments; each is an array of [x, y, z] coordinates
};

function Visualizer3D({ segments }: Visualizer3DProps) {
  const lines = useMemo(() => {
    return segments.map((segment, index) => {
      // Convert each [x, y, z] to a Vector3-compatible array
      const points = segment.map(
        ([x, y, z]) => [x, y, z] as [number, number, number]
      );
      return (
        <Line
          key={index}
          points={points}
          color={index % 2 === 0 ? "blue" : "green"} // Coupling = blue, Backbone = green
          lineWidth={3}
        />
      );
    });
  }, [segments]);

  return (
    <div className="w-full max-w-3xl h-[500px] mx-auto my-6 bg-white rounded-lg shadow-lg border border-gray-200 flex items-center justify-center">
      <Canvas camera={{ position: [200, 200, 200], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[100, 100, 100]} />
        <OrbitControls />
        {lines}
      </Canvas>
    </div>
  );
}

export default Visualizer3D;
