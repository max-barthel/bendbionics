import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';

// Feature imports - using direct imports to avoid export conflicts
import { PresetManager } from './features/presets/components/presets/PresetManager';
import FormTabs from './features/robot-config/components/FormTabs';
import SubmitButton from './features/robot-config/components/SubmitButton';
import { useRobotState } from './features/robot-config/hooks/useRobotState';
import { ErrorBoundary } from './features/shared/components/ErrorBoundary';
import Visualizer3D from './features/visualization/components/Visualizer3D';

import { AuthPage } from './components/auth/AuthPage';
import { UserSettings } from './components/auth/UserSettings';

import { LoadingSpinner, Typography } from './components/ui';
import TahoeGlass from './components/ui/TahoeGlass';
import { AuthProvider, useAuth } from './providers';
import { type RobotConfiguration } from './types/robot';

// Constants
const DEFAULT_SEGMENTS = 5;
const DEFAULT_BACKBONE_LENGTH = 0.07;
const DEFAULT_COUPLING_LENGTH = 0.03;
const DEFAULT_DISCRETIZATION_STEPS = 1000;
const DEFAULT_TENDON_COUNT = 3;
const DEFAULT_TENDON_RADIUS = 0.01;
const DEFAULT_TENDON_OFFSET = 0.0;
const DEFAULT_TIMEOUT = 100;

// Lazy load heavy components
const LazyVisualizer3D = lazy(() => Promise.resolve({ default: Visualizer3D }));

function AppContent() {
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

  // Test localStorage functionality
  useEffect(() => {
    // Test localStorage without alert
    const testKey = 'app_test';
    const testValue = 'app_test_value';
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);

    // Check if token exists
    const existingToken = localStorage.getItem('token');

    // Log localStorage status
    console.log('=== App localStorage Test ===');
    console.log('Test value stored:', testValue);
    console.log('Test value retrieved:', retrievedValue);
    console.log('Existing token:', existingToken ? 'EXISTS' : 'NULL');
    console.log('localStorage working:', retrievedValue === testValue ? 'YES' : 'NO');
    console.log('============================');
  }, []);

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleFormResult = (
    result: number[][][],
    configuration: RobotConfiguration
  ) => {
    setSegments(result);

    // Only update currentConfiguration if we're not loading a preset
    if (!isLoadingPreset) {
      setCurrentConfiguration(configuration);
    }

    // Auto-unfold tendon results panel if tendon analysis data is available
    if (configuration.tendonAnalysis?.actuation_commands) {
      setShowTendonResults(true);
    }
  };

  const handleLoadPreset = (configuration: RobotConfiguration) => {
    console.log('Loading preset configuration:', configuration);

    // Set loading preset flag to prevent circular updates
    setIsLoadingPreset(true);

    // Clear the visualization immediately
    setSegments([]);

    // Reset the current configuration to ensure clean state
    setCurrentConfiguration({});

    // Directly update robot state with preset configuration
    const newRobotState = {
      segments: configuration.segments ?? DEFAULT_SEGMENTS,
      bendingAngles:
        configuration.bendingAngles ??
        Array(configuration.segments ?? DEFAULT_SEGMENTS).fill(0),
      rotationAngles:
        configuration.rotationAngles ??
        Array(configuration.segments ?? DEFAULT_SEGMENTS).fill(0),
      backboneLengths:
        configuration.backboneLengths ??
        Array(configuration.segments ?? DEFAULT_SEGMENTS).fill(DEFAULT_BACKBONE_LENGTH),
      couplingLengths:
        configuration.couplingLengths ??
        Array((configuration.segments ?? DEFAULT_SEGMENTS) + 1).fill(
          DEFAULT_COUPLING_LENGTH
        ),
      discretizationSteps:
        configuration.discretizationSteps ?? DEFAULT_DISCRETIZATION_STEPS,
      tendonConfig: configuration.tendonConfig ?? {
        count: DEFAULT_TENDON_COUNT,
        radius: DEFAULT_TENDON_RADIUS,
        coupling_offset: DEFAULT_TENDON_OFFSET,
      },
    };

    console.log('Directly setting robot state:', newRobotState);
    setRobotState(newRobotState);

    // Use setTimeout to ensure the reset happens before setting the new configuration
    setTimeout(() => {
      setCurrentConfiguration(configuration);
      setPresetLoadKey(prev => prev + 1); // Force FormTabs re-render
      console.log('Preset configuration loaded:', configuration);

      // Reset the loading preset flag after a short delay
      setTimeout(() => {
        setIsLoadingPreset(false);
      }, DEFAULT_TIMEOUT);
    }, 10);

    // Auto-unfold tendon results panel if preset contains tendon analysis data
    if (configuration.tendonAnalysis?.actuation_commands) {
      setShowTendonResults(true);
    }
  };

  const handleLogout = () => {
    void logout();
    navigate('/');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleComputationTriggered = useCallback(() => {
    setTriggerComputation(false);
  }, []);

  const handleShowPresetManager = useCallback(() => {
    setShowPresetManager(true);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (isLoading || isInitializing) {
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

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />

      <Route
        path="/"
        element={
          <div className="h-screen flex flex-col">
            <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300 relative overflow-hidden">
              {/* Full-width visualizer */}
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
                    segments={segments}
                    tendonConfig={currentConfiguration.tendonConfig}
                    tendonAnalysis={currentConfiguration.tendonAnalysis}
                    sidebarCollapsed={sidebarCollapsed}
                    showTendonResults={showTendonResults}
                    setShowTendonResults={setShowTendonResults}
                  />
                </Suspense>
              </div>

              {/* Sidebar Overlay */}
              <div
                className={`fixed top-0 left-0 h-full bg-white/15 backdrop-blur-3xl border-r border-white/30 shadow-2xl transition-all duration-300 ease-in-out overflow-hidden z-40 ${
                  sidebarCollapsed
                    ? 'w-0 -translate-x-full opacity-0'
                    : 'w-96 translate-x-0 opacity-100 rounded-r-2xl'
                }`}
              >
                <div className="w-96 h-full pr-2">
                  <FormTabs
                    key={presetLoadKey}
                    onResult={handleFormResult}
                    initialConfiguration={currentConfiguration}
                    user={user}
                    currentConfiguration={currentConfiguration}
                    onLoadPreset={handleLoadPreset}
                    navigate={navigate}
                    onLoadingChange={setLoading}
                    triggerComputation={triggerComputation}
                    onComputationTriggered={handleComputationTriggered}
                    onShowPresetManager={handleShowPresetManager}
                  />
                </div>
              </div>

              {/* Hide button - positioned outside sidebar */}
              <button
                onClick={toggleSidebar}
                className={`fixed top-1/2 transform -translate-y-1/2 bg-white/40 backdrop-blur-2xl border border-white/50 rounded-full p-1.5 shadow-2xl hover:bg-white/60 hover:shadow-2xl transition-all duration-300 ease-in-out z-50 hover:scale-105 ${
                  sidebarCollapsed
                    ? 'left-4 translate-x-0'
                    : 'left-[calc(384px-16px)] translate-x-0'
                }`}
                aria-label={sidebarCollapsed ? 'Show parameters' : 'Hide parameters'}
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
                    d={sidebarCollapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
                  />
                </svg>
              </button>

              {/* Floating User Menu */}
              <div className="fixed top-4 right-4 z-50">
                {user ? (
                  <div className="group relative">
                    <TahoeGlass
                      as="button"
                      className="flex items-center gap-2 hover:scale-105"
                    >
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
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
                      <span className="text-sm font-medium text-gray-800">
                        {user.username}
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

                    {/* Dropdown Menu */}
                    <TahoeGlass className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                      <div className="p-3 border-b border-white/20">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                            <svg
                              className="w-4 h-4 text-white"
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
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {user.username}
                            </p>
                            <p className="text-xs text-gray-600">Signed in</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={() => setShowUserSettings(true)}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
                        >
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-white/30 rounded-lg transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </TahoeGlass>
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
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
                )}
              </div>
            </div>

            {/* Floating Compute Button */}
            <div
              className={`fixed bottom-6 z-50 transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'left-6' : 'left-[calc(384px+16px)]'
              }`}
            >
              <SubmitButton
                onClick={() => {
                  // Trigger computation from FormTabs
                  setTriggerComputation(true);
                }}
                loading={loading}
              />
            </div>

            {/* Preset Manager Modal */}
            {showPresetManager && (
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
                      currentConfiguration={currentConfiguration || {}}
                      onLoadPreset={config => {
                        handleLoadPreset(config);
                        setShowPresetManager(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* User Settings Modal */}
            {showUserSettings && (
              <UserSettings onClose={() => setShowUserSettings(false)} />
            )}
          </div>
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
