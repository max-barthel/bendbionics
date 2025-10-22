import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

// Feature imports - using direct imports to avoid export conflicts
import ErrorBoundary from './components/ErrorBoundary';
import { PresetManager } from './features/presets/components/presets/PresetManager';
import FormTabs from './features/robot-config/components/FormTabs';
import SubmitButton from './features/robot-config/components/SubmitButton';
import {
  useRobotState,
  type RobotState,
} from './features/robot-config/hooks/useRobotState';
import Visualizer3D from './features/visualization/components/Visualizer3D';

import { AuthPage } from './components/auth/AuthPage';
import { UserSettings } from './components/auth/UserSettings';

import { type User } from './api/auth';
import { LoadingSpinner, Typography } from './components/ui';
import TahoeGlass from './components/ui/TahoeGlass';
import { AuthProvider, useAuth } from './providers';
import { type RobotConfiguration } from './types/robot';
import logger, { LogContext } from './utils/logger';

// Define the app state interface
interface AppState {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  navigate: (path: string) => void;
  segments: number[][][];
  setSegments: (segments: number[][][]) => void;
  isInitializing: boolean;
  setIsInitializing: (initializing: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  triggerComputation: boolean;
  setTriggerComputation: (trigger: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  currentConfiguration: RobotConfiguration;
  setCurrentConfiguration: (config: RobotConfiguration) => void;
  showPresetManager: boolean;
  setShowPresetManager: (show: boolean) => void;
  showTendonResults: boolean;
  setShowTendonResults: (show: boolean) => void;
  isLoadingPreset: boolean;
  setIsLoadingPreset: (loading: boolean) => void;
  presetLoadKey: number;
  setPresetLoadKey: (fn: (prev: number) => number) => void;
  showUserSettings: boolean;
  setShowUserSettings: (show: boolean) => void;
  setRobotState: (state: RobotState) => void;
}

// Constants
const DEFAULT_SEGMENTS = 5;
const DEFAULT_BACKBONE_LENGTH = 0.07;
const DEFAULT_COUPLING_LENGTH = 0.03;
const DEFAULT_DISCRETIZATION_STEPS = 1000;
const DEFAULT_TENDON_COUNT = 3;
const DEFAULT_TENDON_RADIUS = 0.01;
const DEFAULT_TENDON_OFFSET = 0;
const DEFAULT_TIMEOUT = 100;

// Timing constants
const INITIALIZATION_DELAY = 800;
const PRESET_LOAD_DELAY = 10;

// Lazy load heavy components
const LazyVisualizer3D = lazy(() => Promise.resolve({ default: Visualizer3D }));

// Custom hook for app state management
function useAppState() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<number[][][]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [triggerComputation, setTriggerComputation] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<RobotConfiguration>(
    {}
  );
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [showTendonResults, setShowTendonResults] = useState(false);
  const [isLoadingPreset, setIsLoadingPreset] = useState(false);
  const [presetLoadKey, setPresetLoadKey] = useState(0);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Get direct access to robot state for preset loading
  const [, setRobotState] = useRobotState();

  return {
    user,
    isLoading,
    logout,
    navigate,
    segments,
    setSegments,
    isInitializing,
    setIsInitializing,
    loading,
    setLoading,
    triggerComputation,
    setTriggerComputation,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentConfiguration,
    setCurrentConfiguration,
    showPresetManager,
    setShowPresetManager,
    showTendonResults,
    setShowTendonResults,
    isLoadingPreset,
    setIsLoadingPreset,
    presetLoadKey,
    setPresetLoadKey,
    showUserSettings,
    setShowUserSettings,
    setRobotState,
  };
}

// Custom hook for app initialization
function useAppInitialization(setIsInitializing: (value: boolean) => void) {
  useEffect(() => {
    // Test localStorage without alert
    const testKey = 'app_test';
    const testValue = 'app_test_value';
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);

    // Only log if localStorage test fails
    if (import.meta.env.DEV && retrievedValue !== testValue) {
      logger.debug('localStorage test failed:', LogContext.UI, {
        expected: testValue,
        actual: retrievedValue,
      });
    }
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, INITIALIZATION_DELAY);

    return () => clearTimeout(timer);
  }, [setIsInitializing]);
}

// Helper function to create array with default values
function createArrayWithDefaults(length: number, defaultValue: number): number[] {
  return new Array(length).fill(defaultValue) as number[];
}

// Helper function to create tendon config
function createTendonConfig(configuration: RobotConfiguration) {
  return (
    configuration.tendonConfig ?? {
      count: DEFAULT_TENDON_COUNT,
      radius: DEFAULT_TENDON_RADIUS,
      coupling_offset: DEFAULT_TENDON_OFFSET,
    }
  );
}

// Helper function to create robot state from configuration
function createRobotStateFromConfiguration(configuration: RobotConfiguration) {
  const segments = configuration.segments ?? DEFAULT_SEGMENTS;

  return {
    segments,
    bendingAngles: configuration.bendingAngles ?? createArrayWithDefaults(segments, 0),
    rotationAngles:
      configuration.rotationAngles ?? createArrayWithDefaults(segments, 0),
    backboneLengths:
      configuration.backboneLengths ??
      createArrayWithDefaults(segments, DEFAULT_BACKBONE_LENGTH),
    couplingLengths:
      configuration.couplingLengths ??
      createArrayWithDefaults(segments + 1, DEFAULT_COUPLING_LENGTH),
    discretizationSteps:
      configuration.discretizationSteps ?? DEFAULT_DISCRETIZATION_STEPS,
    tendonConfig: createTendonConfig(configuration),
  };
}

// Helper function to handle preset loading completion
function handlePresetLoadingCompletion(
  configuration: RobotConfiguration,
  setCurrentConfiguration: (config: RobotConfiguration) => void,
  setPresetLoadKey: (fn: (prev: number) => number) => void,
  setIsLoadingPreset: (loading: boolean) => void
) {
  setCurrentConfiguration(configuration);
  setPresetLoadKey(prev => prev + 1); // Force FormTabs re-render
  if (import.meta.env.DEV) {
    logger.debug('Preset configuration loaded:', LogContext.UI, { configuration });
  }

  // Reset the loading preset flag after a short delay
  setTimeout(() => {
    setIsLoadingPreset(false);
  }, DEFAULT_TIMEOUT);
}

// Custom hook for preset loading logic
function usePresetLoading(setters: {
  setSegments: (segments: number[][][]) => void;
  setCurrentConfiguration: (config: RobotConfiguration) => void;
  setIsLoadingPreset: (loading: boolean) => void;
  setPresetLoadKey: (fn: (prev: number) => number) => void;
  setShowTendonResults: (show: boolean) => void;
  setRobotState: (state: RobotState) => void;
}) {
  const handleLoadPreset = useCallback(
    (configuration: RobotConfiguration) => {
      if (import.meta.env.DEV) {
        logger.debug('Loading preset configuration:', LogContext.UI, { configuration });
      }

      // Set loading preset flag to prevent circular updates
      setters.setIsLoadingPreset(true);

      // Clear the visualization immediately
      setters.setSegments([]);

      // Reset the current configuration to ensure clean state
      setters.setCurrentConfiguration({});

      // Create and set robot state
      const newRobotState = createRobotStateFromConfiguration(configuration);

      if (import.meta.env.DEV) {
        logger.debug('Directly setting robot state:', LogContext.UI, { newRobotState });
      }
      setters.setRobotState(newRobotState);

      // Use setTimeout to ensure the reset happens before setting the new configuration
      setTimeout(() => {
        handlePresetLoadingCompletion(
          configuration,
          setters.setCurrentConfiguration,
          setters.setPresetLoadKey,
          setters.setIsLoadingPreset
        );
      }, PRESET_LOAD_DELAY);

      // Auto-unfold tendon results panel if preset contains tendon analysis data
      if (configuration.tendonAnalysis?.actuation_commands) {
        setters.setShowTendonResults(true);
      }
    },
    [setters]
  );

  return { handleLoadPreset };
}

// Loading screen component
function LoadingScreen({
  isLoading,
  isInitializing: _isInitializing,
}: {
  readonly isLoading: boolean;
  readonly isInitializing: boolean;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" color="primary" className="mb-4" />
        <Typography variant="h2" color="primary" className="mb-2">
          Loading Soft Robot App
        </Typography>
        <Typography variant="body" color="gray">
          {isLoading ? 'Checking authentication...' : 'Initializing components...'}
        </Typography>
      </div>
    </div>
  );
}

// User avatar icon component
function UserAvatarIcon({ size = 'w-6 h-6' }: { readonly size?: string }) {
  return (
    <div
      className={`${size} bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center`}
    >
      <svg
        className="w-3 h-3 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    </div>
  );
}

// User dropdown menu component
function UserDropdownMenu({ appState }: { readonly appState: AppState }) {
  return (
    <TahoeGlass className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
      <div className="p-3 border-b border-white/20">
        <div className="flex items-center gap-2">
          <UserAvatarIcon size="w-8 h-8" />
          <div>
            <p className="text-sm font-medium text-gray-800">
              {appState.user?.username}
            </p>
            <p className="text-xs text-gray-600">Signed in</p>
          </div>
        </div>
      </div>
      <div className="p-1">
        <button
          onClick={() => appState.setShowUserSettings(true)}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
        >
          Settings
        </button>
        <button
          onClick={() => {
            appState.logout();
            appState.navigate('/');
          }}
          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </TahoeGlass>
  );
}

// Signed in user menu component
function SignedInUserMenu({ appState }: { readonly appState: AppState }) {
  return (
    <div className="group relative">
      <TahoeGlass as="button" className="flex items-center gap-2 hover:scale-105">
        <UserAvatarIcon />
        <span className="text-sm font-medium text-gray-800">
          {appState.user?.username}
        </span>
        <svg
          className="w-4 h-4 text-gray-600 transition-transform group-hover:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </TahoeGlass>
      <UserDropdownMenu appState={appState} />
    </div>
  );
}

// Sign in button component
function SignInButton({ appState }: { readonly appState: AppState }) {
  return (
    <button
      onClick={() => appState.navigate('/auth')}
      className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full relative z-[60] bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
    >
      <svg
        className="w-4 h-4 text-gray-900"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      <span className="text-sm font-medium text-gray-900">Sign In</span>
      <div className="absolute inset-0 rounded-full pointer-events-none z-0 bg-gradient-to-br from-white/10 to-white/5 shadow-inner" />
    </button>
  );
}

// User menu component
function UserMenu({ appState }: { readonly appState: AppState }) {
  return (
    <div className="fixed top-4 right-4 z-50">
      {appState.user ? (
        <SignedInUserMenu appState={appState} />
      ) : (
        <SignInButton appState={appState} />
      )}
    </div>
  );
}

// Sidebar component
function Sidebar({
  appState,
  handleFormResult,
  handleLoadPreset,
  handleComputationTriggered,
  handleShowPresetManager,
}: {
  readonly appState: AppState;
  readonly handleFormResult: (
    result: number[][][],
    configuration: RobotConfiguration
  ) => void;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly handleComputationTriggered: () => void;
  readonly handleShowPresetManager: () => void;
}) {
  return (
    <div
      className={`fixed top-0 left-0 h-full bg-white/15 backdrop-blur-3xl border-r border-white/30 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-40 ${
        appState.sidebarCollapsed
          ? 'w-0 -translate-x-full opacity-0'
          : 'w-96 translate-x-0 opacity-100 rounded-r-2xl'
      }`}
    >
      <div className="w-96 h-full pr-2">
        <FormTabs
          key={appState.presetLoadKey}
          onResult={handleFormResult}
          initialConfiguration={appState.currentConfiguration}
          user={appState.user}
          currentConfiguration={appState.currentConfiguration}
          onLoadPreset={handleLoadPreset}
          navigate={appState.navigate}
          onLoadingChange={appState.setLoading}
          triggerComputation={appState.triggerComputation}
          onComputationTriggered={handleComputationTriggered}
          onShowPresetManager={handleShowPresetManager}
        />
      </div>
    </div>
  );
}

// Sidebar toggle button component
function SidebarToggle({
  appState,
  toggleSidebar,
}: {
  readonly appState: AppState;
  readonly toggleSidebar: () => void;
}) {
  return (
    <button
      onClick={toggleSidebar}
      className={`fixed top-1/2 transform -translate-y-1/2 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105 ${
        appState.sidebarCollapsed
          ? 'left-4 translate-x-0'
          : 'left-[calc(384px-16px)] translate-x-0'
      }`}
      aria-label={appState.sidebarCollapsed ? 'Show parameters' : 'Hide parameters'}
    >
      <svg
        className="w-4 h-4 text-gray-600 transition-transform duration-300"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d={appState.sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
        />
      </svg>
    </button>
  );
}

// Preset manager modal component
function PresetManagerModal({
  appState,
  handleLoadPreset,
  setShowPresetManager,
}: {
  readonly appState: AppState;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly setShowPresetManager: (show: boolean) => void;
}) {
  if (!appState.showPresetManager) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden relative">
        <button
          onClick={() => setShowPresetManager(false)}
          className="absolute top-4 right-4 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out hover:scale-105 z-10"
          aria-label="Close preset manager"
        >
          <svg
            className="w-4 h-4 text-gray-600 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <PresetManager
            currentConfiguration={
              appState.currentConfiguration as Record<string, unknown>
            }
            onLoadPreset={config => {
              handleLoadPreset(config);
              appState.setShowPresetManager(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Modals component
function AppModals({
  appState,
  handleLoadPreset,
  setters,
}: {
  readonly appState: AppState;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly setters: {
    setShowPresetManager: (show: boolean) => void;
    setShowUserSettings: (show: boolean) => void;
  };
}) {
  return (
    <>
      <PresetManagerModal
        appState={appState}
        handleLoadPreset={handleLoadPreset}
        setShowPresetManager={setters.setShowPresetManager}
      />
      {appState.showUserSettings && (
        <UserSettings onClose={() => setters.setShowUserSettings(false)} />
      )}
    </>
  );
}

// 3D Visualizer component
function Visualizer3DWrapper({ appState }: { readonly appState: AppState }) {
  return (
    <div className="w-full h-full bg-white/10 backdrop-blur-sm relative">
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

// Floating compute button component
function FloatingComputeButton({ appState }: { readonly appState: AppState }) {
  return (
    <div
      className={`fixed bottom-6 z-50 transition-all duration-300 ease-in-out ${
        appState.sidebarCollapsed ? 'left-6' : 'left-[calc(384px+16px)]'
      }`}
    >
      <SubmitButton
        onClick={() => {
          // Trigger computation from FormTabs
          appState.setTriggerComputation(true);
        }}
        loading={appState.loading}
      />
    </div>
  );
}

// Main app layout component
function MainAppLayout({
  appState,
  handleFormResult,
  handleLoadPreset,
  handleComputationTriggered,
  handleShowPresetManager,
  toggleSidebar,
}: {
  readonly appState: AppState;
  readonly handleFormResult: (
    result: number[][][],
    configuration: RobotConfiguration
  ) => void;
  readonly handleLoadPreset: (configuration: RobotConfiguration) => void;
  readonly handleComputationTriggered: () => void;
  readonly handleShowPresetManager: () => void;
  readonly toggleSidebar: () => void;
}) {
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
        <Visualizer3DWrapper appState={appState} />
        <Sidebar
          appState={appState}
          handleFormResult={handleFormResult}
          handleLoadPreset={handleLoadPreset}
          handleComputationTriggered={handleComputationTriggered}
          handleShowPresetManager={handleShowPresetManager}
        />
        <SidebarToggle appState={appState} toggleSidebar={toggleSidebar} />
        <UserMenu appState={appState} />
      </div>
      <FloatingComputeButton appState={appState} />
      <AppModals
        appState={appState}
        handleLoadPreset={handleLoadPreset}
        setters={{
          setShowPresetManager: appState.setShowPresetManager,
          setShowUserSettings: appState.setShowUserSettings,
        }}
      />
    </div>
  );
}

// Custom hook for app handlers
function useAppHandlers(
  appState: AppState,
  setters: {
    setSegments: (segments: number[][][]) => void;
    setCurrentConfiguration: (config: RobotConfiguration) => void;
    setShowTendonResults: (show: boolean) => void;
    setTriggerComputation: (trigger: boolean) => void;
    setShowPresetManager: (show: boolean) => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
  }
) {
  const handleFormResult = useCallback(
    (result: number[][][], configuration: RobotConfiguration) => {
      setters.setSegments(result);

      // Only update currentConfiguration if we're not loading a preset
      if (!appState.isLoadingPreset) {
        setters.setCurrentConfiguration(configuration);
      }

      // Auto-unfold tendon results panel if tendon analysis data is available
      if (configuration.tendonAnalysis?.actuation_commands) {
        setters.setShowTendonResults(true);
      }
    },
    [setters, appState.isLoadingPreset]
  );

  const handleComputationTriggered = useCallback(() => {
    setters.setTriggerComputation(false);
  }, [setters]);

  const handleShowPresetManager = useCallback(() => {
    setters.setShowPresetManager(true);
  }, [setters]);

  const toggleSidebar = useCallback(() => {
    setters.setSidebarCollapsed(!appState.sidebarCollapsed);
  }, [setters, appState.sidebarCollapsed]);

  return {
    handleFormResult,
    handleComputationTriggered,
    handleShowPresetManager,
    toggleSidebar,
  };
}

function AppContent() {
  const appState = useAppState();
  useAppInitialization(appState.setIsInitializing);

  const { handleLoadPreset } = usePresetLoading({
    setSegments: appState.setSegments,
    setCurrentConfiguration: appState.setCurrentConfiguration,
    setIsLoadingPreset: appState.setIsLoadingPreset,
    setPresetLoadKey: appState.setPresetLoadKey,
    setShowTendonResults: appState.setShowTendonResults,
    setRobotState: appState.setRobotState,
  });

  const handlers = useAppHandlers(appState, {
    setSegments: appState.setSegments,
    setCurrentConfiguration: appState.setCurrentConfiguration,
    setShowTendonResults: appState.setShowTendonResults,
    setTriggerComputation: appState.setTriggerComputation,
    setShowPresetManager: appState.setShowPresetManager,
    setSidebarCollapsed: appState.setSidebarCollapsed,
  });

  if (appState.isLoading || appState.isInitializing) {
    return (
      <LoadingScreen
        isLoading={appState.isLoading}
        isInitializing={appState.isInitializing}
      />
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/"
        element={
          <MainAppLayout
            appState={appState}
            handleFormResult={handlers.handleFormResult}
            handleLoadPreset={handleLoadPreset}
            handleComputationTriggered={handlers.handleComputationTriggered}
            handleShowPresetManager={handlers.handleShowPresetManager}
            toggleSidebar={handlers.toggleSidebar}
          />
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
