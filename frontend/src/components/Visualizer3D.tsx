import { Line, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { LoadingSpinner, Typography } from "./ui";

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
    <div className="h-full flex flex-col">
      <div className="flex-1 relative">
        {!hasData ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50/80 to-blue-50/40">
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
              className="absolute top-4 right-4 px-4 py-2 bg-white/90 backdrop-blur-sm text-gray-700 text-sm font-medium border border-gray-200/60 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 rounded-lg hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Reset View
              </div>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
