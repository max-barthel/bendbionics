import { lazy, Suspense } from 'react';
import Visualizer3D from '@/features/visualization/components/Visualizer3D';
import { tahoeGlass } from '@/styles/design-tokens';
import { LoadingSpinner, Typography } from '@/components/ui';
import type { AppState } from './UserMenu/types';

// Lazy load heavy component
const LazyVisualizer3D = lazy(() => Promise.resolve({ default: Visualizer3D }));

interface Visualizer3DWrapperProps {
  readonly appState: AppState;
}

export function Visualizer3DWrapper({ appState }: Readonly<Visualizer3DWrapperProps>) {
  return (
    <div className={`w-full h-full ${tahoeGlass.enhanced} relative`}>
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <LoadingSpinner size="lg" color="primary" className="mb-4" />
              <Typography variant="h3" color="gray" className="mb-2">
                Loading 3D Visualizer...
              </Typography>
              <Typography variant="body" color="gray">
                Initializing Three.js components
              </Typography>
            </div>
          </div>
        }
      >
        <LazyVisualizer3D
          segments={appState.segments}
          {...(appState.currentConfiguration.tendonConfig && {
            tendonConfig: appState.currentConfiguration.tendonConfig,
          })}
          {...(appState.currentConfiguration.tendonAnalysis && {
            tendonAnalysis: appState.currentConfiguration.tendonAnalysis,
          })}
          sidebarCollapsed={appState.sidebarCollapsed}
          showTendonResults={appState.showTendonResults}
          setShowTendonResults={appState.setShowTendonResults}
        />
      </Suspense>
    </div>
  );
}
