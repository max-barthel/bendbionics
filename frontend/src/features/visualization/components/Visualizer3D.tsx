import { Line, OrbitControls, Sphere } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Typography } from '../../../components/ui';
import TahoeGlass from '../../../components/ui/TahoeGlass';
import { getTendonColor } from '../../../utils/tendonColors';
import { TendonResultsPanel } from './TendonResultsPanel';

// Constants for 3D visualization
const VISUALIZATION_CONSTANTS = {
  TENDON_ACTIVATION_THRESHOLD: 0.001,
  SPHERE_RADIUS: 0.005,
  SPHERE_SEGMENTS: 8,
  SPHERE_RINGS: 6,
  CAMERA_POSITION: 1.5,
  CAMERA_DISTANCE: 200,
  CAMERA_NEAR: 0.5,
  CAMERA_FAR: 50,
  LIGHT_INTENSITY: 15,
  LIGHT_DISTANCE: 200,
  CAMERA_DISTANCE_MULTIPLIER: 1.5,
  CAMERA_MIN_MULTIPLIER: 0.5,
  CAMERA_MAX_MULTIPLIER: 4,
  CAMERA_MIN_DISTANCE: 50,
  CAMERA_MAX_DISTANCE: 1000,
  CAMERA_FAR_MULTIPLIER: 15,
  LIGHT_POSITION_Z: 200,
} as const;

type Visualizer3DProps = {
  readonly segments: number[][][];
  readonly tendonConfig?: {
    readonly count: number;
    readonly radius: number;
  };
  readonly tendonAnalysis?: {
    readonly actuation_commands: Record<
      string,
      {
        readonly length_change_m: number;
        readonly pull_direction: string;
        readonly magnitude: number;
      }
    >;
    readonly coupling_data?: {
      readonly positions: number[][];
      readonly orientations: number[][][];
    };
    readonly tendon_analysis?: {
      readonly routing_points: number[][][];
    };
  };
  readonly sidebarCollapsed: boolean;
  readonly showTendonResults: boolean;
  readonly setShowTendonResults: (show: boolean) => void;
};

function Visualizer3D({
  segments,
  tendonConfig,
  tendonAnalysis,
  sidebarCollapsed,
  showTendonResults,
  setShowTendonResults,
}: Visualizer3DProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const lines = useMemo(() => {
    return segments
      .map((segment, index) => {
        const points = segment
          .filter(point => point.length === 3 && point.every(Number.isFinite))
          .map(([x, y, z]) => [x, y, z] as [number, number, number]);

        if (points.length < 2) {
          return null;
        }

        return (
          <Line
            key={`segment-${index}-${points.length}`}
            points={points}
            color={index % 2 === 0 ? '#3b82f6' : '#22c55e'}
            lineWidth={2}
          />
        );
      })
      .filter(Boolean);
  }, [segments]);

  // Helper function to extract rotation matrix components
  const extractRotationMatrix = (orientation: number[][]) => {
    return {
      r11: Number(orientation[0]?.[0]) || 1,
      r12: Number(orientation[0]?.[1]) || 0,
      r13: Number(orientation[0]?.[2]) || 0,
      r21: Number(orientation[1]?.[0]) || 0,
      r22: Number(orientation[1]?.[1]) || 1,
      r23: Number(orientation[1]?.[2]) || 0,
      r31: Number(orientation[2]?.[0]) || 0,
      r32: Number(orientation[2]?.[1]) || 0,
      r33: Number(orientation[2]?.[2]) || 1,
    };
  };

  // Helper function to transform local coordinates to global
  const transformToGlobal = (
    localX: number,
    localY: number,
    localZ: number,
    x: number,
    y: number,
    z: number,
    matrix: ReturnType<typeof extractRotationMatrix>
  ) => {
    return {
      globalX: x + matrix.r11 * localX + matrix.r12 * localY + matrix.r13 * localZ,
      globalY: y + matrix.r21 * localX + matrix.r22 * localY + matrix.r23 * localZ,
      globalZ: z + matrix.r31 * localX + matrix.r32 * localY + matrix.r33 * localZ,
    };
  };

  // Helper function to check if tendon is active
  const isTendonActive = (
    tendonId: string,
    tendonAnalysis: NonNullable<Visualizer3DProps['tendonAnalysis']>
  ) => {
    const tendonData = tendonAnalysis.actuation_commands[tendonId];
    return (
      tendonData &&
      Math.abs(tendonData.length_change_m) >
        VISUALIZATION_CONSTANTS.TENDON_ACTIVATION_THRESHOLD
    );
  };

  // Helper function to create tendon eyelets for a coupling point
  const createTendonEyelets = (
    couplingPos: number[],
    couplingIndex: number,
    orientation: number[][],
    tendonCount: number,
    radius: number
  ) => {
    const elements: React.ReactElement[] = [];
    const x = Number(couplingPos[0]) || 0;
    const y = Number(couplingPos[1]) || 0;
    const z = Number(couplingPos[2]) || 0;
    const matrix = extractRotationMatrix(orientation);

    for (let i = 0; i < tendonCount; i++) {
      const angle = (2 * Math.PI * i) / tendonCount;
      const localX = radius * Math.cos(angle);
      const localY = radius * Math.sin(angle);
      const localZ = 0;
      const { globalX, globalY, globalZ } = transformToGlobal(
        localX,
        localY,
        localZ,
        x,
        y,
        z,
        matrix
      );

      // Create eyelet sphere and tendon connection line
      elements.push(
        <Sphere
          key={`tendon-${couplingIndex}-${i}`}
          args={[
            VISUALIZATION_CONSTANTS.SPHERE_RADIUS,
            VISUALIZATION_CONSTANTS.SPHERE_SEGMENTS,
            VISUALIZATION_CONSTANTS.SPHERE_RINGS,
          ]}
          position={[globalX, globalY, globalZ]}
        >
          <meshBasicMaterial color="#000000" />
        </Sphere>,
        <Line
          key={`tendon-line-${couplingIndex}-${i}`}
          points={[
            [globalX, globalY, globalZ],
            [x, y, z],
          ]}
          color="#9ca3af"
          lineWidth={1}
        />
      );
    }

    return elements;
  };

  // Helper function to create tendon routing lines
  const createTendonRouting = (
    couplingPositions: number[][][],
    tendonCount: number,
    tendonAnalysis: NonNullable<Visualizer3DProps['tendonAnalysis']>
  ) => {
    const elements: React.ReactElement[] = [];

    for (
      let couplingIndex = 0;
      couplingIndex < couplingPositions.length - 1;
      couplingIndex++
    ) {
      for (let tendonIndex = 0; tendonIndex < tendonCount; tendonIndex++) {
        const currentEyelet =
          tendonAnalysis.tendon_analysis?.routing_points?.[couplingIndex]?.[
            tendonIndex
          ];
        const nextEyelet =
          tendonAnalysis.tendon_analysis?.routing_points?.[couplingIndex + 1]?.[
            tendonIndex
          ];

        if (
          !currentEyelet ||
          !nextEyelet ||
          currentEyelet.length < 3 ||
          nextEyelet.length < 3
        ) {
          continue;
        }

        const tendonId = (tendonIndex + 1).toString();
        const isActive = isTendonActive(tendonId, tendonAnalysis);
        const tendonColor = getTendonColor(tendonId);

        elements.push(
          <Line
            key={`tendon-routing-${couplingIndex}-${tendonIndex}`}
            points={[
              [currentEyelet[0] || 0, currentEyelet[1] || 0, currentEyelet[2] || 0],
              [nextEyelet[0] || 0, nextEyelet[1] || 0, nextEyelet[2] || 0],
            ]}
            color={tendonColor}
            lineWidth={isActive ? 3 : 2}
            dashed={!isActive}
          />
        );
      }
    }

    return elements;
  };

  // Generate tendon eyelets and connections with proper transformations
  const tendonElements = useMemo(() => {
    if (!tendonConfig || !tendonAnalysis?.coupling_data) {
      return [];
    }

    const elements: React.ReactElement[] = [];
    const { count: tendonCount, radius } = tendonConfig;
    const { positions: couplingPositions, orientations: couplingOrientations } =
      tendonAnalysis.coupling_data;

    // Create tendon eyelets for each coupling point
    for (const [couplingIndex, couplingPos] of couplingPositions.entries()) {
      if (couplingPos.length < 3) continue;

      const orientation = couplingOrientations[couplingIndex];
      if (!orientation || orientation.length < 3) continue;

      elements.push(
        ...createTendonEyelets(
          couplingPos,
          couplingIndex,
          orientation,
          tendonCount,
          radius
        )
      );
    }

    // Add tendon routing lines between consecutive coupling elements
    if (couplingPositions.length > 1) {
      elements.push(
        ...createTendonRouting(
          tendonAnalysis.tendon_analysis?.routing_points || [],
          tendonCount,
          tendonAnalysis
        )
      );
    }

    return elements;
  }, [tendonConfig, tendonAnalysis]);

  const { center, size } = useMemo(() => {
    const allPoints = segments
      .flat()
      .filter(p => p.length === 3 && p.every(Number.isFinite));

    if (allPoints.length === 0) {
      return { center: [0, 0, 0] as [number, number, number], size: 100 };
    }

    const xs = allPoints.map(([x]) => x ?? 0).filter(Number.isFinite);
    const ys = allPoints.map(([, y]) => y ?? 0).filter(Number.isFinite);
    const zs = allPoints.map(([, , z]) => z ?? 0).filter(Number.isFinite);

    if (xs.length === 0 || ys.length === 0 || zs.length === 0) {
      return { center: [0, 0, 0] as [number, number, number], size: 100 };
    }

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    const center = [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2] as [
      number,
      number,
      number,
    ];

    const size = Math.max(maxX - minX, maxY - minY, maxZ - minZ);

    return { center, size };
  }, [segments]);

  const { cameraDistance, minDistance, maxDistance } = useMemo(() => {
    return {
      cameraDistance:
        size * VISUALIZATION_CONSTANTS.CAMERA_DISTANCE_MULTIPLIER ||
        VISUALIZATION_CONSTANTS.CAMERA_DISTANCE,
      minDistance:
        size * VISUALIZATION_CONSTANTS.CAMERA_MIN_MULTIPLIER ||
        VISUALIZATION_CONSTANTS.CAMERA_MIN_DISTANCE,
      maxDistance:
        size * VISUALIZATION_CONSTANTS.CAMERA_MAX_MULTIPLIER ||
        VISUALIZATION_CONSTANTS.CAMERA_MAX_DISTANCE,
    };
  }, [size]);

  const resetView = () => {
    if (!controlsRef.current) {
      return;
    }
    controlsRef.current.target.set(...center);
    controlsRef.current.object.position.set(
      center[0] + cameraDistance,
      center[1] - cameraDistance,
      center[2] + cameraDistance
    );
    controlsRef.current.update();
  };

  const hasData = useMemo(() => {
    return segments.some(segment => segment.length > 0);
  }, [segments]);

  const showEmptyState = useMemo(() => {
    return !hasData;
  }, [hasData]);

  return (
    <div className="h-full flex flex-col" data-testid="visualizer-3d">
      <div className="flex-1 relative">
        {showEmptyState ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <TahoeGlass className="p-8 max-w-md mx-4" size="xl">
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
                    <div className="absolute -top-2 -right-2 w-2 h-2 bg-blue-400/60 rounded-full animate-bounce [animation-delay:0s] [animation-duration:2s]"></div>
                    <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce [animation-delay:1s] [animation-duration:2.5s]"></div>
                    <div className="absolute top-1/2 -left-3 w-1 h-1 bg-blue-300/60 rounded-full animate-bounce [animation-delay:0.5s] [animation-duration:3s]"></div>
                  </div>
                </div>
                <Typography variant="h3" className="text-gray-800 mb-3 font-semibold">
                  Ready to Compute
                </Typography>
                <Typography variant="body" className="text-gray-600 leading-relaxed">
                  Configure your robot parameters and click{' '}
                  <span className="font-medium text-gray-800">Compute</span> to see the
                  3D visualization
                </Typography>
              </div>
            </TahoeGlass>
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
                far: size * VISUALIZATION_CONSTANTS.CAMERA_FAR_MULTIPLIER,
              }}
              className="bg-gray-50"
            >
              <ambientLight />
              <pointLight />
              <axesHelper />
              <OrbitControls
                ref={controlsRef}
                enableDamping={false}
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
              className={`absolute top-4 px-4 py-2 backdrop-blur-xl text-gray-900 text-sm font-medium border border-blue-400/30 shadow-lg transition-all duration-300 rounded-full hover:scale-105 z-50 bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20 ${
                sidebarCollapsed ? 'left-4' : 'left-[calc(384px+16px)]'
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
              <div className="absolute inset-0 rounded-full pointer-events-none bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
            </button>

            {/* Tendon Results Panel */}
            {tendonAnalysis && (
              <TendonResultsPanel
                tendonAnalysis={tendonAnalysis}
                isVisible={showTendonResults}
                onToggle={() => setShowTendonResults(!showTendonResults)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
