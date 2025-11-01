import { Route, Routes } from 'react-router-dom';

// Feature imports
import ErrorBoundary from '@/components/ErrorBoundary';
import { LoadingScreen, MainAppLayout } from '@/components/app';
import { AuthPage } from '@/components/auth/AuthPage';
import { EmailVerification } from '@/components/auth/EmailVerification';
import { AppStateProvider, AuthProvider, useAppState } from '@/providers';

function AppContent() {
  const appState = useAppState();

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
      <Route path="/" element={<MainAppLayout />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppStateProvider>
          <AppContent />
        </AppStateProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
