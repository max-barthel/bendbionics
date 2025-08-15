import { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Form from "./components/Form";
import { AuthPage } from "./components/auth/AuthPage";
import { EmailVerificationPage } from "./components/auth/EmailVerificationPage";
import { Button, LoadingSpinner, Typography } from "./components/ui";
import { AuthProvider, useAuth } from "./providers";

// Lazy load heavy components
const Visualizer3D = lazy(() => import("./components/Visualizer3D"));
const PresetManager = lazy(() =>
  import("./components/presets/PresetManager").then((module) => ({
    default: module.PresetManager,
  }))
);

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<number[][][]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<
    Record<string, any>
  >({});

  useEffect(() => {
    // Simulate app initialization
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const handleFormResult = (
    result: number[][][],
    configuration: Record<string, any>
  ) => {
    setSegments(result);
    setCurrentConfiguration(configuration);
  };

  const handleLoadPreset = (configuration: Record<string, any>) => {
    setCurrentConfiguration(configuration);
    // You might want to update the form with the loaded configuration
    // This would require passing the configuration back to the Form component
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleSignIn = () => {
    navigate("/auth");
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
            {isLoading
              ? "Checking authentication..."
              : "Initializing components..."}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/verify-email" element={<EmailVerificationPage />} />
      <Route
        path="/"
        element={
          <div>
            <div className="bg-blue-500 text-white p-4 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Typography variant="h1" color="white">
                    Soft Robot App
                  </Typography>
                  <div className="flex items-center gap-2">
                    {user ? (
                      <>
                        <Typography variant="body" color="white">
                          Welcome, {user.email}
                        </Typography>
                        {!user.is_verified && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                            Email not verified
                          </span>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                          Guest Mode
                        </span>
                        <Typography variant="body" color="white">
                          Sign in to save presets
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <Button
                      variant="secondary"
                      onClick={() => setShowPresetManager(!showPresetManager)}
                    >
                      {showPresetManager ? "Hide Presets" : "Show Presets"}
                    </Button>
                  )}
                  {user ? (
                    <Button variant="outline" onClick={handleLogout}>
                      Logout
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={handleSignIn}>
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              <div className="space-y-6">
                <Form
                  onResult={handleFormResult}
                  initialConfiguration={currentConfiguration}
                />
                {showPresetManager && (
                  <Suspense
                    fallback={
                      <div className="w-full p-6 flex items-center justify-center bg-gray-50 rounded-md">
                        <div className="text-center">
                          <LoadingSpinner
                            size="md"
                            color="primary"
                            className="mb-2"
                          />
                          <Typography variant="body" color="gray">
                            Loading Preset Manager...
                          </Typography>
                        </div>
                      </div>
                    }
                  >
                    <PresetManager
                      currentConfiguration={currentConfiguration}
                      onLoadPreset={handleLoadPreset}
                    />
                  </Suspense>
                )}
              </div>
              <Suspense
                fallback={
                  <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 rounded-md">
                    <div className="text-center">
                      <LoadingSpinner
                        size="lg"
                        color="primary"
                        className="mb-4"
                      />
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
                <Visualizer3D segments={segments} />
              </Suspense>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
