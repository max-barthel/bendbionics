import { Suspense, lazy, useEffect, useState } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import FormTabs from "./components/FormTabs";
import { AuthPage } from "./components/auth/AuthPage";

import { LoadingSpinner, Typography } from "./components/ui";
import { AuthProvider, useAuth } from "./providers";

// Lazy load heavy components
const Visualizer3D = lazy(() => import("./components/Visualizer3D"));

function AppContent() {
  const { user, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<number[][][]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentConfiguration, setCurrentConfiguration] = useState<
    Record<string, any>
  >({});

  // Test localStorage functionality
  useEffect(() => {
    // Test localStorage without alert
    const testKey = "app_test";
    const testValue = "app_test_value";
    localStorage.setItem(testKey, testValue);
    const retrievedValue = localStorage.getItem(testKey);

    // Check if token exists
    const existingToken = localStorage.getItem("token");

    // Log localStorage status
    console.log("=== App localStorage Test ===");
    console.log("Test value stored:", testValue);
    console.log("Test value retrieved:", retrievedValue);
    console.log("Existing token:", existingToken ? "EXISTS" : "NULL");
    console.log(
      "localStorage working:",
      retrievedValue === testValue ? "YES" : "NO"
    );
    console.log("============================");
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
    console.log("Sign in button clicked");
    navigate("/auth");
  };

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

      <Route
        path="/"
        element={
          <div>
            <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200/60 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-end">
                {user ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-blue-600"
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
                      <span className="font-medium">{user.username}</span>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Button clicked");
                      handleSignIn();
                    }}
                    className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer z-10 relative bg-white/80 backdrop-blur-sm border border-blue-200/40 rounded-md hover:bg-white hover:shadow-sm"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>

            <div className="flex h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 to-gray-100 relative">
              {!sidebarCollapsed && (
                <div className="w-96 flex-shrink-0 bg-white/80 backdrop-blur-sm border-r border-gray-200/60 shadow-sm">
                  <FormTabs
                    onResult={handleFormResult}
                    initialConfiguration={currentConfiguration}
                    user={user}
                    currentConfiguration={currentConfiguration}
                    onLoadPreset={handleLoadPreset}
                    navigate={navigate}
                  />
                </div>
              )}

              {/* Hide button - positioned outside sidebar */}
              {!sidebarCollapsed && (
                <button
                  onClick={toggleSidebar}
                  className="absolute left-[calc(384px-16px)] top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-gray-300/60 rounded-full p-1.5 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 z-50"
                  aria-label="Hide parameters"
                >
                  <svg
                    className="w-4 h-4 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}

              <div
                className={`${
                  sidebarCollapsed ? "w-full" : "flex-1"
                } bg-white/90 backdrop-blur-sm relative`}
              >
                {sidebarCollapsed && (
                  <button
                    onClick={toggleSidebar}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm border border-gray-300/60 rounded-full p-1.5 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 z-50"
                    aria-label="Show parameters"
                  >
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
                <Suspense
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
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
