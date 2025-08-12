import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Card, LoadingSpinner, Typography } from "./ui";

type Visualizer3DProps = {
  segments: number[][][];
};

function Visualizer3D({ segments }: Visualizer3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const lines = useMemo(() => {
    return segments
      .map((segment, index) => {
        const points = segment
          .filter((point) => point.length === 3 && point.every(Number.isFinite))
          .map(([x, y, z]) => [x, y, z] as [number, number, number]);

        if (points.length < 2) return null;

        return (
          <Line
            key={index}
            points={points}
            color={index % 2 === 0 ? "#3b82f6" : "#22c55e"}
            lineWidth={2}
          />
        );
      })
      .filter(Boolean);
  }, [segments]);

  const { center, size } = useMemo(() => {
    const allPoints = segments
      .flat()
      .filter((p) => p.length === 3 && p.every(Number.isFinite));

    if (allPoints.length === 0) {
      return { center: [0, 0, 0] as [number, number, number], size: 100 };
    }

    const xs = allPoints.map(([x]) => x);
    const ys = allPoints.map(([, y]) => y);
    const zs = allPoints.map(([, , z]) => z);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const center = [
      (minX + maxX) / 2,
      (minY + maxY) / 2,
      (minZ + maxZ) / 2,
    ] as [number, number, number];

    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

    return { center, size };
  }, [segments]);

  const cameraDistance = size * 1.5 || 200;
  const minDistance = size * 0.5 || 50;
  const maxDistance = size * 4 || 1000;

  const resetView = () => {
    if (!controlsRef.current) return;
    controlsRef.current.target.set(...center);
    controlsRef.current.object.position.set(
      center[0] + cameraDistance,
      center[1] - cameraDistance,
      center[2] + cameraDistance
    );
    controlsRef.current.update();
  };

  const hasData =
    segments.length > 0 && segments.some((segment) => segment.length > 0);

  return (
    <Card>
      <Typography variant="h2" color="primary">
        3D Visualization
      </Typography>

      <div className="relative w-full h-[500px] rounded-md overflow-hidden">
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <LoadingSpinner size="lg" color="primary" className="mb-4" />
            <Typography variant="h3" color="gray" className="mb-2">
              Waiting for computation...
            </Typography>
            <Typography variant="body" color="gray">
              Enter parameters and click Compute to visualize
            </Typography>
          </div>
        ) : (
          <>
            <Canvas
              camera={{
                position: [
                  center[0] + cameraDistance,
                  center[1] - cameraDistance,
                  center[2] + cameraDistance,
                ],
                fov: 45,
                up: [0, 0, 1],
                near: 0.1, // Optional, default is 0.1
                far: size * 15,
              }}
            >
              <ambientLight intensity={0.6} />
              <pointLight position={[100, 100, 200]} intensity={0.8} />
              <axesHelper args={[size || 100]} />
              <OrbitControls
                ref={controlsRef}
                enableDamping
                dampingFactor={0.15}
                rotateSpeed={0.5}
                minDistance={minDistance}
                maxDistance={maxDistance}
                target={center}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={0}
                enablePan={true}
              />
              {lines}
            </Canvas>

            {/* Reset Button */}
            <button
              onClick={resetView}
              className="absolute top-4 right-4 px-3 py-1.5 bg-neutral-800 text-white text-sm rounded-md shadow hover:bg-neutral-700 transition"
            >
              Reset View
            </button>
          </>
        )}
      </div>
    </Card>
  );
}

export default Visualizer3D;
