import { Suspense, useEffect, useState } from "react";
import { robotAPI, type PCCParams } from "../api/client";
import { useRobotState, type RobotState } from "../hooks/useRobotState";
import ArrayInputGroup from "./ArrayInputGroup";
import SubmitButton from "./SubmitButton";
import { PresetManager } from "./presets/PresetManager";
import {
  Button,
  LoadingSpinner,
  ProgressIndicator,
  SliderInput,
  TabPanel,
  Tabs,
  Typography,
} from "./ui";

type FormTabsProps = {
  onResult: (
    segments: number[][][],
    configuration: Record<string, any>
  ) => void;
  initialConfiguration?: Record<string, any>;
  user?: any;
  currentConfiguration?: Record<string, any>;
  onLoadPreset?: (configuration: Record<string, any>) => void;
  navigate?: (path: string) => void;
};

type ErrorType = "network" | "validation" | "server" | "unknown";

type ErrorState = {
  type: ErrorType;
  message: string;
  visible: boolean;
};

function FormTabs({
  onResult,
  initialConfiguration,
  user,
  currentConfiguration,
  onLoadPreset,
  navigate,
}: FormTabsProps) {
  const [robotState, setRobotState] = useRobotState();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [computationProgress, setComputationProgress] = useState(0);
  const [error, setError] = useState<ErrorState>({
    type: "unknown",
    message: "",
    visible: false,
  });
  const [activeTab, setActiveTab] = useState("basic");

  // Load initial configuration if provided
  useEffect(() => {
    if (initialConfiguration && Object.keys(initialConfiguration).length > 0) {
      const config = initialConfiguration;
      setRobotState({
        segments: config.segments || 5,
        bendingAngles: config.bendingAngles || [
          0.628319, 0.628319, 0.628319, 0.628319, 0.628319,
        ],
        rotationAngles: config.rotationAngles || [0, 0, 0, 0, 0],
        backboneLengths: config.backboneLengths || [
          0.07, 0.07, 0.07, 0.07, 0.07,
        ],
        couplingLengths: config.couplingLengths || [
          0.03, 0.03, 0.03, 0.03, 0.03, 0.03,
        ],
        discretizationSteps: config.discretizationSteps || 1000,
      });
    }
  }, [initialConfiguration]);

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => ({ ...prev, ...updates }));
  };

  const showError = (type: ErrorType, message: string) => {
    setError({ type, message, visible: true });
    setTimeout(() => {
      setError((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const hideError = () => {
    setError((prev) => ({ ...prev, visible: false }));
  };

  const validateForm = async (): Promise<boolean> => {
    setValidating(true);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const backboneLengths = [
      robotState.bendingAngles.length,
      robotState.rotationAngles.length,
      robotState.backboneLengths.length,
    ];
    const couplingLength = robotState.couplingLengths.length;

    if (backboneLengths.some((length) => length === 0)) {
      showError(
        "validation",
        "All backbone parameter arrays must have at least one value."
      );
      setValidating(false);
      return false;
    }

    if (couplingLength === 0) {
      showError(
        "validation",
        "Coupling lengths array must have at least one value."
      );
      setValidating(false);
      return false;
    }

    if (new Set(backboneLengths).size > 1) {
      showError(
        "validation",
        "All backbone parameter arrays must have the same number of values."
      );
      setValidating(false);
      return false;
    }

    const backboneLength = backboneLengths[0];
    if (couplingLength !== backboneLength + 1) {
      showError(
        "validation",
        `Coupling lengths array must have ${backboneLength + 1} values.`
      );
      setValidating(false);
      return false;
    }

    if (robotState.discretizationSteps <= 0) {
      showError("validation", "Discretization steps must be greater than 0.");
      setValidating(false);
      return false;
    }

    const allValues = [
      ...robotState.bendingAngles,
      ...robotState.rotationAngles,
      ...robotState.backboneLengths,
      ...robotState.couplingLengths,
    ];

    if (allValues.some((val) => isNaN(val) || !isFinite(val))) {
      showError("validation", "All parameter values must be valid numbers.");
      setValidating(false);
      return false;
    }

    setValidating(false);
    return true;
  };

  const handleSubmit = async () => {
    hideError();
    if (!(await validateForm())) return;

    setLoading(true);
    setComputationProgress(0);

    const progressInterval = setInterval(() => {
      setComputationProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      const params: PCCParams = {
        bending_angles: robotState.bendingAngles,
        rotation_angles: robotState.rotationAngles,
        backbone_lengths: robotState.backboneLengths,
        coupling_lengths: robotState.couplingLengths,
        discretization_steps: robotState.discretizationSteps,
      };

      const result = await robotAPI.computePCC(params);
      setComputationProgress(100);

      const configuration = {
        segments: robotState.segments,
        bendingAngles: robotState.bendingAngles,
        rotationAngles: robotState.rotationAngles,
        backboneLengths: robotState.backboneLengths,
        couplingLengths: robotState.couplingLengths,
        discretizationSteps: robotState.discretizationSteps,
      };

      onResult(result.segments, configuration);
    } catch (err: any) {
      console.error("Failed to submit:", err);
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        showError(
          "network",
          "Request timed out. Please check your connection and try again."
        );
      } else if (err.response?.status === 500) {
        showError(
          "server",
          "Server error occurred. Please try again later or contact support."
        );
      } else if (err.response?.status === 400) {
        showError(
          "validation",
          "Invalid parameters provided. Please check your input values."
        );
      } else if (err.response?.status === 404) {
        showError(
          "server",
          "Service not found. Please check if the backend is running."
        );
      } else if (!err.response) {
        showError(
          "network",
          "Unable to connect to server. Please check your connection."
        );
      } else {
        showError("unknown", "An unexpected error occurred. Please try again.");
      }
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
      setComputationProgress(0);
    }
  };

  const tabs = [
    { id: "basic", label: "Basic" },
    { id: "angles", label: "Angles" },
    { id: "lengths", label: "Lengths" },
    { id: "advanced", label: "Advanced" },
    { id: "presets", label: "Presets" },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
        <Typography variant="h2" color="primary" className="font-semibold">
          Parameters
        </Typography>
        {validating && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <LoadingSpinner size="sm" color="primary" />
            <span>Validating...</span>
          </div>
        )}
      </div>

      {error.visible && (
        <div className="mx-6 mt-4 p-4 border-l-4 bg-red-50 border-red-400 text-red-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium">{error.message}</p>
            </div>
            <button
              type="button"
              onClick={hideError}
              aria-label="Close error message"
              className="text-red-500 hover:bg-red-100 focus:ring-red-500 inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="px-4"
      />

      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white/50 to-gray-50/30">
        <TabPanel id="basic" activeTab={activeTab}>
          <div className="space-y-4">
            <div>
              <SliderInput
                label="Segments"
                value={robotState.segments}
                onChange={(segments: number) => updateRobotState({ segments })}
                min={1}
                max={10}
                step={1}
                placeholder="Segments"
              />
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/40 border border-blue-200/40 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-3">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-blue-900">Robot Structure</p>
                </div>
                <ul className="text-sm space-y-2 text-blue-800/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      <strong className="text-blue-900">
                        {robotState.segments}
                      </strong>{" "}
                      backbone(s) +{" "}
                      <strong className="text-blue-900">
                        {robotState.segments + 1}
                      </strong>{" "}
                      coupling(s)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      Each segment consists of one backbone and one coupling
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      The base coupling is always present (first coupling)
                    </span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      Adjusting segments will automatically update all input
                      fields
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="angles" activeTab={activeTab}>
          <div className="space-y-4">
            <ArrayInputGroup
              label="Bending Angles"
              values={robotState.bendingAngles}
              onChange={(bendingAngles) => updateRobotState({ bendingAngles })}
              mode="angle"
            />
            <ArrayInputGroup
              label="Rotation Angles"
              values={robotState.rotationAngles}
              onChange={(rotationAngles) =>
                updateRobotState({ rotationAngles })
              }
              mode="angle"
            />
          </div>
        </TabPanel>

        <TabPanel id="lengths" activeTab={activeTab}>
          <div className="space-y-4">
            <ArrayInputGroup
              label="Backbone Lengths"
              values={robotState.backboneLengths}
              onChange={(backboneLengths) =>
                updateRobotState({ backboneLengths })
              }
              mode="length"
            />
            <ArrayInputGroup
              label="Coupling Lengths"
              values={robotState.couplingLengths}
              onChange={(couplingLengths) =>
                updateRobotState({ couplingLengths })
              }
              mode="length"
            />
          </div>
        </TabPanel>

        <TabPanel id="advanced" activeTab={activeTab}>
          <div className="space-y-4">
            <SliderInput
              label="Discretization Steps"
              value={robotState.discretizationSteps}
              onChange={(discretizationSteps: number) =>
                updateRobotState({ discretizationSteps })
              }
              min={100}
              max={5000}
              step={100}
              placeholder="Steps"
            />
            <div className="text-sm text-neutral-600 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 p-3 border border-blue-100/40">
              <p className="font-medium mb-1">Discretization:</p>
              <p className="text-xs">
                Higher values provide smoother curves but require more
                computation time.
              </p>
            </div>
          </div>
        </TabPanel>

        <TabPanel id="presets" activeTab={activeTab}>
          <div className="space-y-4">
            {user ? (
              <Suspense
                fallback={
                  <div className="w-full p-4 flex items-center justify-center">
                    <LoadingSpinner size="md" color="primary" />
                  </div>
                }
              >
                <PresetManager
                  currentConfiguration={currentConfiguration || {}}
                  onLoadPreset={onLoadPreset || (() => {})}
                />
              </Suspense>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <Typography
                  variant="h4"
                  color="primary"
                  className="mb-2 font-medium"
                >
                  Sign in to Access Presets
                </Typography>
                <Typography
                  variant="body"
                  color="gray"
                  className="mb-4 text-sm"
                >
                  Save and load your favorite robot configurations
                </Typography>
                <Button
                  variant="primary"
                  onClick={() => navigate?.("/auth")}
                  className="w-full max-w-xs"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </TabPanel>
      </div>

      <div className="p-4 bg-gradient-to-r from-gray-50/80 to-white/80 border-t border-gray-200/60 backdrop-blur-sm">
        {loading && (
          <div className="mb-4">
            <ProgressIndicator
              progress={computationProgress}
              message="Computing robot configuration..."
            />
          </div>
        )}
        <div className="flex justify-center">
          <SubmitButton onClick={handleSubmit} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default FormTabs;
