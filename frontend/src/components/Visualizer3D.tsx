import { Line, OrbitControls, Sphere } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { TendonResultsPanel } from "./TendonResultsPanel";
import { Typography } from "./ui";

type Visualizer3DProps = {
  segments: number[][][];
  tendonConfig?: {
    count: number;
    radius: number;
    coupling_offset: number;
  };
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
      positions: number[][][];
      orientations: number[][][];
    };
    tendon_analysis?: {
      routing_points: number[][][];
    };
  };
  sidebarCollapsed: boolean;
};

function Visualizer3D({
  segments,
  tendonConfig,
  tendonAnalysis,
  sidebarCollapsed,
}: Visualizer3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [showResultsPanel, setShowResultsPanel] = useState(false);

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

  // Generate tendon eyelets and connections with proper transformations
  const tendonElements = useMemo(() => {
    if (!tendonConfig || !tendonAnalysis?.coupling_data) {
      console.log("Tendon visualization debug:", {
        hasTendonConfig: !!tendonConfig,
        hasTendonAnalysis: !!tendonAnalysis,
        hasCouplingData: !!tendonAnalysis?.coupling_data,
        couplingData: tendonAnalysis?.coupling_data,
      });
      return [];
    }

    console.log("Coupling data received:", tendonAnalysis.coupling_data);
    const elements: React.ReactElement[] = [];
    const tendonCount = tendonConfig.count;
    const radius = tendonConfig.radius;
    const offset = tendonConfig.coupling_offset;
    const couplingPositions = tendonAnalysis.coupling_data.positions;
    const couplingOrientations = tendonAnalysis.coupling_data.orientations;

    // For each coupling point, create tendon eyelets with proper orientation
    couplingPositions.forEach((couplingPos, couplingIndex) => {
      if (couplingPos.length < 3) return;

      // Extract x, y, z coordinates as numbers
      const x = Number(couplingPos[0]) || 0;
      const y = Number(couplingPos[1]) || 0;
      const z = Number(couplingPos[2]) || 0;
      const orientation = couplingOrientations[couplingIndex];

      if (!orientation || orientation.length < 3) return;

      // Extract rotation matrix components as numbers
      const r11 = Number(orientation[0]?.[0]) || 1;
      const r12 = Number(orientation[0]?.[1]) || 0;
      const r13 = Number(orientation[0]?.[2]) || 0;
      const r21 = Number(orientation[1]?.[0]) || 0;
      const r22 = Number(orientation[1]?.[1]) || 1;
      const r23 = Number(orientation[1]?.[2]) || 0;
      const r31 = Number(orientation[2]?.[0]) || 0;
      const r32 = Number(orientation[2]?.[1]) || 0;
      const r33 = Number(orientation[2]?.[2]) || 1;

      // Create tendon eyelets around the coupling point with proper orientation
      for (let i = 0; i < tendonCount; i++) {
        const angle = (2 * Math.PI * i) / tendonCount;

        // Base eyelet position in local coordinate system
        const localX = radius * Math.cos(angle);
        const localY = radius * Math.sin(angle);
        const localZ = offset;

        // Transform local coordinates to global coordinates using rotation matrix
        const globalX = x + r11 * localX + r12 * localY + r13 * localZ;
        const globalY = y + r21 * localX + r22 * localY + r23 * localZ;
        const globalZ = z + r31 * localX + r32 * localY + r33 * localZ;

        // Get tendon analysis data for this tendon
        const tendonId = i.toString();
        const tendonData = tendonAnalysis.actuation_commands[tendonId];
        const isActive =
          tendonData && Math.abs(tendonData.length_change_m) > 0.001;

        // Create eyelet sphere
        elements.push(
          <Sphere
            key={`tendon-${couplingIndex}-${i}`}
            args={[0.005, 8, 6]}
            position={[globalX, globalY, globalZ]}
          >
            <meshStandardMaterial
              color={isActive ? "#ef4444" : "#6b7280"}
              metalness={0.8}
              roughness={0.2}
            />
          </Sphere>
        );

        // Add tendon connection line to the coupling center
        elements.push(
          <Line
            key={`tendon-line-${couplingIndex}-${i}`}
            points={[
              [globalX, globalY, globalZ],
              [x, y, z + offset],
            ]}
            color={isActive ? "#dc2626" : "#9ca3af"}
            lineWidth={1}
            dashed={!isActive}
          />
        );
      }
    });

    // Debug: Log the tendon analysis data structure
    console.log("Tendon analysis debug:", {
      hasTendonAnalysis: !!tendonAnalysis,
      tendonAnalysisKeys: tendonAnalysis ? Object.keys(tendonAnalysis) : [],
      routingPoints: tendonAnalysis?.tendon_analysis?.routing_points,
      couplingPositionsLength: couplingPositions.length,
    });

    // Add tendon routing lines between consecutive coupling elements
    if (couplingPositions.length > 1) {
      for (
        let couplingIndex = 0;
        couplingIndex < couplingPositions.length - 1;
        couplingIndex++
      ) {
        for (let tendonIndex = 0; tendonIndex < tendonCount; tendonIndex++) {
          const currentCouplingPos = couplingPositions[couplingIndex];
          const nextCouplingPos = couplingPositions[couplingIndex + 1];

          if (currentCouplingPos.length < 3 || nextCouplingPos.length < 3)
            continue;

          // Get current eyelet position
          const currentEyelet =
            tendonAnalysis.tendon_analysis?.routing_points?.[couplingIndex]?.[
              tendonIndex
            ];
          if (!currentEyelet || currentEyelet.length < 3) continue;

          // Get next eyelet position
          const nextEyelet =
            tendonAnalysis.tendon_analysis?.routing_points?.[
              couplingIndex + 1
            ]?.[tendonIndex];
          if (!nextEyelet || nextEyelet.length < 3) continue;

          // Check if this tendon is active (has significant length change)
          const tendonId = (tendonIndex + 1).toString();
          const tendonData = tendonAnalysis.actuation_commands[tendonId];
          const isActive =
            tendonData && Math.abs(tendonData.length_change_m) > 0.001;

          // Add tendon routing line between eyelets
          elements.push(
            <Line
              key={`tendon-routing-${couplingIndex}-${tendonIndex}`}
              points={[
                [currentEyelet[0], currentEyelet[1], currentEyelet[2]],
                [nextEyelet[0], nextEyelet[1], nextEyelet[2]],
              ]}
              color={isActive ? "#dc2626" : "#9ca3af"}
              lineWidth={2}
              dashed={!isActive}
            />
          );
        }
      }
    }

    return elements;
  }, [tendonConfig, tendonAnalysis]);

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
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100/80 to-gray-200/60">
            <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-xl shadow-2xl p-8 max-w-md mx-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  {/* Floating geometric shapes animation */}
                  <div className="w-20 h-20 relative">
                    {/* Main rotating ring */}
                    <div className="absolute inset-0 border-2 border-blue-400/30 rounded-full animate-spin">
                      <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full transform -translate-x-1/2 -translate-y-1"></div>
                    </div>

                    {/* Inner pulsing circle */}
                    <div className="absolute inset-2 border border-indigo-400/40 rounded-full animate-pulse"></div>

                    {/* Center dot with glow */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg animate-pulse"></div>
                    </div>

                    {/* Floating particles */}
                    <div
                      className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400/60 rounded-full animate-bounce"
                      style={{ animationDelay: "0s", animationDuration: "2s" }}
                    ></div>
                    <div
                      className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce"
                      style={{
                        animationDelay: "1s",
                        animationDuration: "2.5s",
                      }}
                    ></div>
                    <div
                      className="absolute top-1/2 -left-3 w-1 h-1 bg-blue-300/60 rounded-full animate-bounce"
                      style={{
                        animationDelay: "0.5s",
                        animationDuration: "3s",
                      }}
                    ></div>
                  </div>
                </div>
                <Typography
                  variant="h3"
                  className="text-gray-800 mb-3 font-semibold"
                >
                  Ready to Compute
                </Typography>
                <Typography
                  variant="body"
                  className="text-gray-600 leading-relaxed"
                >
                  Configure your robot parameters and click{" "}
                  <span className="font-medium text-gray-800">Compute</span> to
                  see the 3D visualization
                </Typography>
              </div>
            </div>
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
                near: 0.01,
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
              {tendonElements}
            </Canvas>

            {/* Reset Button */}
            <button
              onClick={resetView}
              className={`absolute top-4 px-4 py-2 bg-white/20 backdrop-blur-xl text-gray-800 text-sm font-medium border border-white/30 shadow-2xl hover:bg-white/30 hover:shadow-2xl transition-all duration-300 rounded-full hover:scale-105 ${
                sidebarCollapsed ? "left-4" : "left-[calc(384px+16px)]"
              }`}
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

            {/* Tendon Results Panel */}
            <TendonResultsPanel
              tendonAnalysis={tendonAnalysis}
              isVisible={showResultsPanel}
              onToggle={() => setShowResultsPanel(!showResultsPanel)}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
