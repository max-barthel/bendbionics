import { Button } from '@/components/ui';
import { VISUALIZATION_CONSTANTS } from '@/constants/visualization';
import { buttonVariants } from '@/styles/design-tokens';
import { getTendonColor } from '@/utils/tendonColors';
import { Line, OrbitControls, Sphere } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { CoordinateTooltip } from './CoordinateTooltip';
import { TendonResultsPanel } from './TendonResultsPanel';

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
      readonly segment_lengths: number[][];
      readonly total_lengths: number[][];
      readonly length_changes: number[][];
      readonly segment_length_changes: number[][];
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
  const [clickedCoordinates, setClickedCoordinates] = useState<{
    x: number;
    y: number;
    z: number;
    screenX: number;
    screenY: number;
  } | null>(null);

  // Handle click on 3D objects
  const handleObjectClick = useCallback((event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const point = event.point;
    const nativeEvent = event.nativeEvent;

    setClickedCoordinates({
      x: point.x,
      y: point.y,
      z: point.z,
      screenX: nativeEvent.clientX,
      screenY: nativeEvent.clientY,
    });
  }, []);

  // Show dialog when coordinates are available
  useEffect(() => {
    if (clickedCoordinates) {
      // Use setTimeout to ensure the dialog is rendered before showing
      const timer = setTimeout(() => {
        const dialog = document.querySelector(
          'dialog[aria-label="Coordinate information panel"]'
        ) as HTMLDialogElement;
        if (dialog) {
          dialog.show();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [clickedCoordinates]);

  const lines = useMemo(() => {
    const lineElements: React.ReactElement[] = [];
    const clickablePoints: React.ReactElement[] = [];

    for (const [index, segment] of segments.entries()) {
      const points = segment
        .filter(point => point.length === 3 && point.every(Number.isFinite))
        .map(([x, y, z]) => [x, y, z] as [number, number, number]);

      if (points.length < 2) {
        continue;
      }

      // Add line
      lineElements.push(
        <Line
          key={`segment-${index}-${points.length}`}
          points={points}
          color={index % 2 === 0 ? '#808080' : '#000000'}
          lineWidth={3}
        />
      );

      // Add clickable spheres at key points (start, mid, end)
      // Use Set to ensure unique indices
      const keyPointIndicesSet = new Set<number>([
        0, // Start
        Math.floor(points.length / 2), // Mid
        points.length - 1, // End
      ]);

      // Convert to array and sort for consistent ordering
      const uniquePointIndices = Array.from(keyPointIndicesSet).sort((a, b) => a - b);

      for (let i = 0; i < uniquePointIndices.length; i++) {
        const pointIndex = uniquePointIndices[i];
        if (pointIndex === undefined) continue;
        const point = points[pointIndex];
        if (point) {
          clickablePoints.push(
            <Sphere
              key={`segment-point-${index}-${pointIndex}-${i}`}
              args={[
                VISUALIZATION_CONSTANTS.SPHERE_RADIUS *
                  VISUALIZATION_CONSTANTS.CLICKABLE_SPHERE_SEGMENT_MULTIPLIER,
                VISUALIZATION_CONSTANTS.CLICKABLE_SPHERE_SEGMENTS,
                VISUALIZATION_CONSTANTS.CLICKABLE_SPHERE_RINGS,
              ]}
              position={[point[0], point[1], point[2]]}
              onClick={handleObjectClick}
            >
              <meshBasicMaterial color="#000000" opacity={0} />
            </Sphere>
          );
        }
      }
    }

    return [...lineElements, ...clickablePoints];
  }, [segments, handleObjectClick]);

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
  // Uses routing_points directly from backend (no calculations)
  const createTendonEyelets = (
    couplingPos: number[],
    couplingIndex: number,
    routingPoints: number[][],
    tendonCount: number
  ) => {
    const elements: React.ReactElement[] = [];
    const x = Number(couplingPos[0]) || 0;
    const y = Number(couplingPos[1]) || 0;
    const z = Number(couplingPos[2]) || 0;

    // Use routing_points directly from backend (no calculations)
    for (let i = 0; i < tendonCount; i++) {
      const eyeletPos = routingPoints[i];
      if (!eyeletPos || eyeletPos.length < 3) continue;

      const eyeletX = Number(eyeletPos[0]) || 0;
      const eyeletY = Number(eyeletPos[1]) || 0;
      const eyeletZ = Number(eyeletPos[2]) || 0;

      // Create eyelet sphere and tendon connection line
      elements.push(
        <Sphere
          key={`tendon-${couplingIndex}-${i}`}
          args={[
            VISUALIZATION_CONSTANTS.SPHERE_RADIUS,
            VISUALIZATION_CONSTANTS.SPHERE_SEGMENTS,
            VISUALIZATION_CONSTANTS.SPHERE_RINGS,
          ]}
          position={[eyeletX, eyeletY, eyeletZ]}
          onClick={handleObjectClick}
        >
          <meshBasicMaterial color="#000000" />
        </Sphere>,
        <Line
          key={`tendon-line-${couplingIndex}-${i}`}
          points={[
            [eyeletX, eyeletY, eyeletZ],
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
            lineWidth={2}
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
    const { count: tendonCount } = tendonConfig;
    const { positions: couplingPositions } = tendonAnalysis.coupling_data;

    // Create clickable spheres at coupling center points (start, mid, end)
    for (const [couplingIndex, couplingPos] of couplingPositions.entries()) {
      if (couplingPos.length < 3) continue;

      const x = Number(couplingPos[0]) || 0;
      const y = Number(couplingPos[1]) || 0;
      const z = Number(couplingPos[2]) || 0;

      // Add invisible clickable sphere at coupling center (larger for easier clicking)
      elements.push(
        <Sphere
          key={`coupling-center-${couplingIndex}`}
          args={[
            VISUALIZATION_CONSTANTS.SPHERE_RADIUS *
              VISUALIZATION_CONSTANTS.CLICKABLE_SPHERE_COUPLING_MULTIPLIER,
            VISUALIZATION_CONSTANTS.SPHERE_SEGMENTS,
            VISUALIZATION_CONSTANTS.SPHERE_RINGS,
          ]}
          position={[x, y, z]}
          onClick={handleObjectClick}
        >
          <meshBasicMaterial color="#000000" opacity={0} />
        </Sphere>
      );
    }

    // Create tendon eyelets for each coupling point using routing_points from backend
    const routingPoints = tendonAnalysis.tendon_analysis?.routing_points || [];
    for (const [couplingIndex, couplingPos] of couplingPositions.entries()) {
      if (couplingPos.length < 3) continue;

      // Get routing_points for this coupling element (directly from backend)
      const couplingRoutingPoints = routingPoints[couplingIndex];
      if (!couplingRoutingPoints || couplingRoutingPoints.length === 0) {
        continue;
      }

      elements.push(
        ...createTendonEyelets(
          couplingPos,
          couplingIndex,
          couplingRoutingPoints,
          tendonCount
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
  }, [tendonConfig, tendonAnalysis, handleObjectClick]);

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

  // Memoize the toggle callback to prevent unnecessary re-renders
  const handleToggleTendonResults = useCallback(() => {
    setShowTendonResults(!showTendonResults);
  }, [showTendonResults, setShowTendonResults]);

  return (
    <div className="h-full flex flex-col" data-testid="visualizer-3d">
      <div className="flex-1 relative">
        {showEmptyState ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            {/* Empty state removed to allow auto-compute UX without CTA */}
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
            <Button
              variant="primary"
              onClick={resetView}
              className={`absolute top-4 px-4 py-2 z-50 ${
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
                <span className={buttonVariants.primaryText}>Reset View</span>
              </div>
            </Button>

            {/* Tendon Results Panel */}
            {tendonAnalysis && (
              <TendonResultsPanel
                tendonAnalysis={tendonAnalysis}
                isVisible={showTendonResults}
                onToggle={handleToggleTendonResults}
              />
            )}

            {/* Coordinate Tooltip */}
            {clickedCoordinates && (
              <CoordinateTooltip
                x={clickedCoordinates.x}
                y={clickedCoordinates.y}
                z={clickedCoordinates.z}
                screenX={clickedCoordinates.screenX}
                screenY={clickedCoordinates.screenY}
                onClose={() => setClickedCoordinates(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Visualizer3D;
