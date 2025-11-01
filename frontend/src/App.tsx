import { Route, Routes } from 'react-router-dom';

// Feature imports
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingScreen, MainAppLayout } from './components/app';
import { AuthPage } from './components/auth/AuthPage';
import { EmailVerification } from './components/auth/EmailVerification';
import { useAppHandlers } from './hooks/app/useAppHandlers';
import { useAppInitialization } from './hooks/app/useAppInitialization';
import { useAppState } from './hooks/app/useAppState';
import { usePresetLoading } from './hooks/app/usePresetLoading';
import { AuthProvider } from './providers';

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
      <Route path="/verify-email" element={<EmailVerification />} />
      <Route
        path="/"
        element={
          <MainAppLayout
            appState={appState}
            handleFormResult={handlers.handleFormResult}
            handleLoadPreset={handleLoadPreset}
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
