import { useEffect, useState } from "react";
import { robotAPI, type PCCParams } from "../api/client";
import { useRobotState, type RobotState } from "../hooks/useRobotState";
import ArrayInputGroup from "./ArrayInputGroup";
import SubmitButton from "./SubmitButton";
import { Card, LoadingSpinner, SliderInput, Typography } from "./ui";

type FormProps = {
  onResult: (
    segments: number[][][],
    configuration: Record<string, any>
  ) => void;
  initialConfiguration?: Record<string, any>;
};

type ErrorType = "network" | "validation" | "server" | "unknown";

interface ErrorState {
  type: ErrorType;
  message: string;
  visible: boolean;
}

function Form({ onResult, initialConfiguration }: FormProps) {
  const [robotState, setRobotState] = useRobotState();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [computationProgress, setComputationProgress] = useState(0);
  const [error, setError] = useState<ErrorState>({
    type: "unknown",
    message: "",
    visible: false,
  });

  // Load initial configuration if provided
  useEffect(() => {
    if (initialConfiguration) {
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
    // If no initialConfiguration is provided, the useRobotState hook will use its own defaults
  }, [initialConfiguration]); // Removed setRobotState from dependencies

  const updateRobotState = (updates: Partial<RobotState>) => {
    setRobotState((prev) => ({ ...prev, ...updates }));
  };

  const showError = (type: ErrorType, message: string) => {
    setError({ type, message, visible: true });
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      setError((prev) => ({ ...prev, visible: false }));
    }, 5000);
  };

  const hideError = () => {
    setError((prev) => ({ ...prev, visible: false }));
  };

  const validateForm = async (): Promise<boolean> => {
    setValidating(true);

    // Simulate validation delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Check if all arrays have at least one value
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

    // Check if backbone parameters have the same length
    if (new Set(backboneLengths).size > 1) {
      showError(
        "validation",
        "All backbone parameter arrays (bending angles, rotation angles, backbone lengths) must have the same number of values."
      );
      setValidating(false);
      return false;
    }

    // Check if coupling lengths is one element longer than backbone parameters
    const backboneLength = backboneLengths[0];
    if (couplingLength !== backboneLength + 1) {
      showError(
        "validation",
        `Coupling lengths array must have ${
          backboneLength + 1
        } values (one more than the ${backboneLength} backbone parameters).`
      );
      setValidating(false);
      return false;
    }

    // Check if discretization steps is valid
    if (robotState.discretizationSteps <= 0) {
      showError("validation", "Discretization steps must be greater than 0.");
      setValidating(false);
      return false;
    }

    // Check for invalid values
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
    // Clear any existing errors
    hideError();

    // Validate form before submission
    if (!(await validateForm())) {
      return;
    }

    setLoading(true);
    setComputationProgress(0);

    // Simulate progress updates during computation
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

      // Create configuration object to pass back
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

      // Determine error type and show appropriate message
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

  return (
    <>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="flex flex-col space-y-6"
        >
          <div className="flex items-center gap-3">
            <Typography variant="h2" color="primary">
              Soft Robot Parameters
            </Typography>
            {validating && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <LoadingSpinner size="sm" color="primary" />
                <span>Validating...</span>
              </div>
            )}
          </div>

          {/* Error Message Display */}
          {error.visible && (
            <div
              className={`p-4 rounded-lg border-l-4 ${
                error.type === "validation"
                  ? "bg-amber-50 border-amber-400 text-amber-800"
                  : error.type === "network"
                  ? "bg-blue-50 border-blue-400 text-blue-800"
                  : error.type === "server"
                  ? "bg-red-50 border-red-400 text-red-800"
                  : "bg-gray-50 border-gray-400 text-gray-800"
              }`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {error.type === "validation" && (
                    <svg
                      className="h-5 w-5 text-amber-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {error.type === "network" && (
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {error.type === "server" && (
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
                  )}
                  {error.type === "unknown" && (
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium">{error.message}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={hideError}
                    aria-label="Close error message"
                    title="Close error message"
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      error.type === "validation"
                        ? "text-amber-500 hover:bg-amber-100 focus:ring-amber-500"
                        : error.type === "network"
                        ? "text-blue-500 hover:bg-blue-100 focus:ring-blue-500"
                        : error.type === "server"
                        ? "text-red-500 hover:bg-red-100 focus:ring-red-500"
                        : "text-gray-500 hover:bg-gray-100 focus:ring-gray-500"
                    }`}
                  >
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
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
            </div>
          )}

          <div className="space-y-2">
            <SliderInput
              label="Segments"
              value={robotState.segments}
              onChange={(segments: number) => updateRobotState({ segments })}
              min={1}
              max={10}
              step={1}
              placeholder="Segments"
            />
            <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Robot Structure:</p>
              <ul className="text-xs space-y-1">
                <li>
                  • <strong>{robotState.segments}</strong> backbone(s) +{" "}
                  <strong>{robotState.segments + 1}</strong> coupling(s)
                </li>
                <li>
                  • Each segment consists of one backbone and one coupling
                </li>
                <li>• The base coupling is always present (first coupling)</li>
                <li>
                  • Adjusting segments will automatically update all input
                  fields below
                </li>
              </ul>
            </div>
          </div>

          <ArrayInputGroup
            label="Bending Angles"
            values={robotState.bendingAngles}
            onChange={(bendingAngles) => updateRobotState({ bendingAngles })}
            mode="angle"
          />

          <ArrayInputGroup
            label="Rotation Angles"
            values={robotState.rotationAngles}
            onChange={(rotationAngles) => updateRobotState({ rotationAngles })}
            mode="angle"
          />

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

          <div>
            <SubmitButton onClick={handleSubmit} loading={loading} />
          </div>
        </form>
      </Card>
    </>
  );
}

export default Form;
