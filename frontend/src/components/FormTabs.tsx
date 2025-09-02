import {
  Suspense,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { robotAPI, type PCCParams } from "../api/client";
import { useRobotState, type RobotState } from "../hooks/useRobotState";
import ArrayInputGroup from "./ArrayInputGroup";
import { TendonConfigPanel } from "./TendonConfigPanel";
import { PresetManager } from "./presets/PresetManager";
import { Button, SliderInput, TabPanel, Tabs, Typography } from "./ui";

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
  onLoadingChange?: (loading: boolean) => void;
  triggerComputation?: boolean;
  onComputationTriggered?: () => void;
};

type FormTabsRef = {
  handleSubmit: () => Promise<void>;
};

type ErrorType = "network" | "validation" | "server" | "unknown";

type ErrorState = {
  type: ErrorType;
  message: string;
  visible: boolean;
};

const FormTabs = forwardRef<FormTabsRef, FormTabsProps>(
  (
    {
      onResult,
      initialConfiguration,
      user,
      currentConfiguration,
      onLoadPreset,
      navigate,
      onLoadingChange,
      triggerComputation,
      onComputationTriggered,
    },
    ref
  ) => {
    const [robotState, setRobotState] = useRobotState();
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<ErrorState>({
      type: "unknown",
      message: "",
      visible: false,
    });
    const [activeTab, setActiveTab] = useState("basic");

    // Load initial configuration if provided
    useEffect(() => {
      if (
        initialConfiguration &&
        Object.keys(initialConfiguration).length > 0
      ) {
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
          tendonConfig: config.tendonConfig || {
            count: 4,
            radius: 0.01,
            coupling_offset: 0.0,
          },
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
        return false;
      }

      if (couplingLength === 0) {
        showError(
          "validation",
          "Coupling lengths array must have at least one value."
        );
        return false;
      }

      if (new Set(backboneLengths).size > 1) {
        showError(
          "validation",
          "All backbone parameter arrays must have the same number of values."
        );
        return false;
      }

      const backboneLength = backboneLengths[0];
      if (couplingLength !== backboneLength + 1) {
        showError(
          "validation",
          `Coupling lengths array must have ${backboneLength + 1} values.`
        );
        return false;
      }

      if (robotState.discretizationSteps <= 0) {
        showError("validation", "Discretization steps must be greater than 0.");
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
        return false;
      }

      return true;
    };

    const handleSubmit = async () => {
      hideError();
      if (!(await validateForm())) return;

      setLoading(true);

      try {
        const params: PCCParams = {
          bending_angles: robotState.bendingAngles,
          rotation_angles: robotState.rotationAngles,
          backbone_lengths: robotState.backboneLengths,
          coupling_lengths: robotState.couplingLengths,
          discretization_steps: robotState.discretizationSteps,
          tendon_config: robotState.tendonConfig,
        };

        // Use tendon endpoint if tendon configuration is provided
        let result;
        if (robotState.tendonConfig) {
          result = await robotAPI.computePCCWithTendons(params);
          // Extract segments from tendon result
          const segments = result.result.robot_positions;

          const configuration = {
            segments: robotState.segments,
            bendingAngles: robotState.bendingAngles,
            rotationAngles: robotState.rotationAngles,
            backboneLengths: robotState.backboneLengths,
            couplingLengths: robotState.couplingLengths,
            discretizationSteps: robotState.discretizationSteps,
            tendonConfig: robotState.tendonConfig,
            tendonAnalysis: result.result,
          };

          onResult(segments, configuration);
        } else {
          result = await robotAPI.computePCC(params);

          const configuration = {
            segments: robotState.segments,
            bendingAngles: robotState.bendingAngles,
            rotationAngles: robotState.rotationAngles,
            backboneLengths: robotState.backboneLengths,
            couplingLengths: robotState.couplingLengths,
            discretizationSteps: robotState.discretizationSteps,
          };

          onResult(result.segments, configuration);
        }
      } catch (error: any) {
        console.error("Computation failed:", error);
        showError(
          "server",
          error.response?.data?.detail || error.message || "Computation failed"
        );
      } finally {
        setLoading(false);
      }
    };

    // Notify parent of loading state changes
    useEffect(() => {
      onLoadingChange?.(loading);
    }, [loading, onLoadingChange]);

    // Handle external computation trigger
    useEffect(() => {
      if (triggerComputation && !loading) {
        handleSubmit();
        onComputationTriggered?.();
      }
    }, [triggerComputation, loading, onComputationTriggered]);

    useImperativeHandle(ref, () => ({
      handleSubmit,
    }));

    const tabs = [
      { id: "basic", label: "Basic" },
      { id: "angles", label: "Angles" },
      { id: "lengths", label: "Lengths" },
      { id: "tendons", label: "Tendons" },
      { id: "advanced", label: "Advanced" },
      { id: "presets", label: "Presets" },
    ];

    return (
      <div className="h-full flex flex-col">
        {error.visible && (
          <div className="mx-6 mt-4 p-4 border-l-4 bg-red-50 border-red-400 text-red-800 flex-shrink-0">
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
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
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
          className="px-4 flex-shrink-0"
        />

        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white/50 to-gray-50/30 min-h-0">
          <TabPanel id="basic" activeTab={activeTab}>
            <div className="space-y-4">
              <div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <Typography variant="label" color="neutral" as="label">
                      Segments
                    </Typography>
                  </div>
                  <SliderInput
                    value={robotState.segments}
                    onChange={(segments: number) =>
                      updateRobotState({ segments })
                    }
                    min={1}
                    max={10}
                    step={1}
                    placeholder="Segments"
                    label=""
                  />
                </div>
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
                    <p className="font-semibold text-blue-900">
                      Robot Structure
                    </p>
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
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
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
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  </div>
                  <Typography variant="label" color="neutral" as="label">
                    Bending Angles
                  </Typography>
                </div>
                <ArrayInputGroup
                  label=""
                  values={robotState.bendingAngles}
                  onChange={(bendingAngles) =>
                    updateRobotState({ bendingAngles })
                  }
                  mode="angle"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center">
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
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <Typography variant="label" color="neutral" as="label">
                    Rotation Angles
                  </Typography>
                </div>
                <ArrayInputGroup
                  label=""
                  values={robotState.rotationAngles}
                  onChange={(rotationAngles) =>
                    updateRobotState({ rotationAngles })
                  }
                  mode="angle"
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel id="lengths" activeTab={activeTab}>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
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
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <Typography variant="label" color="neutral" as="label">
                    Backbone Lengths
                  </Typography>
                </div>
                <ArrayInputGroup
                  label=""
                  values={robotState.backboneLengths}
                  onChange={(backboneLengths) =>
                    updateRobotState({ backboneLengths })
                  }
                  mode="length"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-full flex items-center justify-center">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <Typography variant="label" color="neutral" as="label">
                    Coupling Lengths
                  </Typography>
                </div>
                <ArrayInputGroup
                  label=""
                  values={robotState.couplingLengths}
                  onChange={(couplingLengths) =>
                    updateRobotState({ couplingLengths })
                  }
                  mode="length"
                />
              </div>
            </div>
          </TabPanel>

          <TabPanel id="tendons" activeTab={activeTab}>
            <div className="space-y-4">
              <TendonConfigPanel
                tendonConfig={
                  robotState.tendonConfig || {
                    count: 4,
                    radius: 0.01,
                    coupling_offset: 0.0,
                  }
                }
                onConfigChange={(tendonConfig) =>
                  updateRobotState({ tendonConfig })
                }
                tendonResults={currentConfiguration?.tendonAnalysis}
              />
            </div>
          </TabPanel>

          <TabPanel id="advanced" activeTab={activeTab}>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <Typography variant="label" color="neutral" as="label">
                    Discretization Steps
                  </Typography>
                </div>
                <SliderInput
                  value={robotState.discretizationSteps}
                  onChange={(discretizationSteps: number) =>
                    updateRobotState({ discretizationSteps })
                  }
                  min={100}
                  max={5000}
                  step={100}
                  placeholder="Steps"
                  label=""
                />
              </div>
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
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-blue-900">Discretization</p>
                </div>
                <ul className="text-sm space-y-2 text-blue-800/80">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                    <span>
                      Higher values provide smoother curves but require more
                      computation time
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </TabPanel>

          <TabPanel id="presets" activeTab={activeTab}>
            <div className="space-y-4">
              {user ? (
                <Suspense
                  fallback={
                    <div className="w-full p-4 flex items-center justify-center text-gray-500">
                      Loading presets...
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
                    size="lg"
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
      </div>
    );
  }
);

export default FormTabs;
