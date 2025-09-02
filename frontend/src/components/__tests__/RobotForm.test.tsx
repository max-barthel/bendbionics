import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { robotAPI } from "../../api/client";
import RobotForm from "../RobotForm";

// Mock the robotAPI
vi.mock("../../api/client", () => ({
  robotAPI: {
    computePCC: vi.fn(),
  },
}));

// Mock the useRobotState hook
vi.mock("../../hooks/useRobotState", () => ({
  useRobotState: vi.fn(),
}));

describe("RobotForm", () => {
  const mockOnResult = vi.fn();
  const mockSetRobotState = vi.fn();

  const defaultRobotState = {
    segments: 5,
    bendingAngles: [0.628319, 0.628319, 0.628319, 0.628319, 0.628319],
    rotationAngles: [0, 0, 0, 0, 0],
    backboneLengths: [0.07, 0.07, 0.07, 0.07, 0.07],
    couplingLengths: [0.03, 0.03, 0.03, 0.03, 0.03, 0.03],
    discretizationSteps: 1000,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useRobotState } = await import("../../hooks/useRobotState");
    (useRobotState as any).mockReturnValue([
      defaultRobotState,
      mockSetRobotState,
    ]);
  });

  it("renders the form with all input fields", () => {
    render(<RobotForm onResult={mockOnResult} />);

    expect(screen.getByText("Soft Robot Parameters")).toBeInTheDocument();
    expect(screen.getByText("Segments")).toBeInTheDocument();
    expect(screen.getByText("Bending Angles")).toBeInTheDocument();
    expect(screen.getByText("Rotation Angles")).toBeInTheDocument();
    expect(screen.getByText("Backbone Lengths")).toBeInTheDocument();
    expect(screen.getByText("Coupling Lengths")).toBeInTheDocument();
    expect(screen.getByText("Discretization Steps")).toBeInTheDocument();
  });

  it("displays robot structure information", () => {
    render(<RobotForm onResult={mockOnResult} />);

    expect(screen.getByText(/backbone\(s\) \+/)).toBeInTheDocument();
    expect(screen.getByText(/coupling\(s\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Each segment consists of one backbone and one coupling/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The base coupling is always present/)
    ).toBeInTheDocument();
  });

  it("loads initial configuration when provided", () => {
    const initialConfig = {
      segments: 3,
      bendingAngles: [1.0, 1.0, 1.0],
      rotationAngles: [0.5, 0.5, 0.5],
      backboneLengths: [0.05, 0.05, 0.05],
      couplingLengths: [0.02, 0.02, 0.02, 0.02],
      discretizationSteps: 500,
    };

    render(
      <RobotForm onResult={mockOnResult} initialConfiguration={initialConfig} />
    );

    expect(mockSetRobotState).toHaveBeenCalledWith(initialConfig);
  });

  it("updates robot state when segments slider changes", () => {
    render(<RobotForm onResult={mockOnResult} />);

    const segmentsSlider = screen.getByRole("slider", { name: /segments/i });
    fireEvent.change(segmentsSlider, { target: { value: "3" } });

    expect(mockSetRobotState).toHaveBeenCalledWith(expect.any(Function));
  });

  it("shows validation error for empty arrays", async () => {
    const { useRobotState } = await import("../../hooks/useRobotState");
    (useRobotState as any).mockReturnValue([
      {
        ...defaultRobotState,
        bendingAngles: [],
        rotationAngles: [],
        backboneLengths: [],
        couplingLengths: [],
      },
      mockSetRobotState,
    ]);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /All backbone parameter arrays must have at least one value/
        )
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for mismatched array lengths", async () => {
    const { useRobotState } = await import("../../hooks/useRobotState");
    (useRobotState as any).mockReturnValue([
      {
        ...defaultRobotState,
        bendingAngles: [1.0, 1.0],
        rotationAngles: [0.5, 0.5, 0.5],
        backboneLengths: [0.05, 0.05],
        couplingLengths: [0.02, 0.02, 0.02],
      },
      mockSetRobotState,
    ]);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /All backbone parameter arrays \(bending angles, rotation angles, backbone lengths\) must have the same number of values/
        )
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for incorrect coupling lengths", async () => {
    const { useRobotState } = await import("../../hooks/useRobotState");
    (useRobotState as any).mockReturnValue([
      {
        ...defaultRobotState,
        bendingAngles: [1.0, 1.0, 1.0],
        rotationAngles: [0.5, 0.5, 0.5],
        backboneLengths: [0.05, 0.05, 0.05],
        couplingLengths: [0.02, 0.02, 0.02], // Should be 4, not 3
      },
      mockSetRobotState,
    ]);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Coupling lengths array must have 4 values/)
      ).toBeInTheDocument();
    });
  });

  it("shows validation error for invalid discretization steps", async () => {
    const { useRobotState } = await import("../../hooks/useRobotState");
    (useRobotState as any).mockReturnValue([
      {
        ...defaultRobotState,
        discretizationSteps: 0,
      },
      mockSetRobotState,
    ]);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Discretization steps must be greater than 0/)
      ).toBeInTheDocument();
    });
  });

  it("successfully submits form with valid data", async () => {
    const mockResult = {
      segments: [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
        [
          [7, 8, 9],
          [10, 11, 12],
        ],
      ],
    };

    vi.mocked(robotAPI.computePCC).mockResolvedValue(mockResult);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(robotAPI.computePCC).toHaveBeenCalledWith({
        bending_angles: defaultRobotState.bendingAngles,
        rotation_angles: defaultRobotState.rotationAngles,
        backbone_lengths: defaultRobotState.backboneLengths,
        coupling_lengths: defaultRobotState.couplingLengths,
        discretization_steps: defaultRobotState.discretizationSteps,
      });
    });

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledWith(mockResult.segments, {
        segments: defaultRobotState.segments,
        bendingAngles: defaultRobotState.bendingAngles,
        rotationAngles: defaultRobotState.rotationAngles,
        backboneLengths: defaultRobotState.backboneLengths,
        couplingLengths: defaultRobotState.couplingLengths,
        discretizationSteps: defaultRobotState.discretizationSteps,
      });
    });
  });

  it("shows network error on timeout", async () => {
    const timeoutError = new Error("timeout");
    timeoutError.code = "ECONNABORTED";
    vi.mocked(robotAPI.computePCC).mockRejectedValue(timeoutError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Request timed out. Please check your connection and try again/
        )
      ).toBeInTheDocument();
    });
  });

  it("shows server error on 500 status", async () => {
    const serverError = new Error("Server Error");
    serverError.response = { status: 500 };
    vi.mocked(robotAPI.computePCC).mockRejectedValue(serverError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Server error occurred. Please try again later or contact support/
        )
      ).toBeInTheDocument();
    });
  });

  it("shows validation error on 400 status", async () => {
    const validationError = new Error("Bad Request");
    validationError.response = { status: 400 };
    vi.mocked(robotAPI.computePCC).mockRejectedValue(validationError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Invalid parameters provided. Please check your input values/
        )
      ).toBeInTheDocument();
    });
  });

  it("shows network error when no response", async () => {
    const networkError = new Error("Network Error");
    vi.mocked(robotAPI.computePCC).mockRejectedValue(networkError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          /Unable to connect to server. Please check your connection/
        )
      ).toBeInTheDocument();
    });
  });

  it("hides error message when close button is clicked", async () => {
    const serverError = new Error("Server Error");
    serverError.response = { status: 500 };
    vi.mocked(robotAPI.computePCC).mockRejectedValue(serverError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/)).toBeInTheDocument();
    });

    const closeButton = screen.getByRole("button", {
      name: /close error message/i,
    });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(
        screen.queryByText(/Server error occurred/)
      ).not.toBeInTheDocument();
    });
  });

  it("shows loading state during submission", async () => {
    vi.mocked(robotAPI.computePCC).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    // Wait for the loading state to appear
    await waitFor(() => {
      expect(screen.getByText(/Computing\.\.\./)).toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", { name: /computing\.\.\./i })
    ).toBeDisabled();
  });

  it("shows progress indicator during computation", async () => {
    vi.mocked(robotAPI.computePCC).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    // Wait for the progress indicator to appear
    await waitFor(() => {
      expect(screen.getByText("Computing...")).toBeInTheDocument();
    });
  });

  it("auto-hides error message after 5 seconds", async () => {
    const serverError = new Error("Server Error");
    serverError.response = { status: 500 };
    vi.mocked(robotAPI.computePCC).mockRejectedValue(serverError);

    render(<RobotForm onResult={mockOnResult} />);

    const submitButton = screen.getByRole("button", { name: /compute/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Server error occurred/)).toBeInTheDocument();
    });

    // Wait for the error to auto-hide (reduced timeout for testing)
    await waitFor(
      () => {
        expect(
          screen.queryByText(/Server error occurred/)
        ).not.toBeInTheDocument();
      },
      { timeout: 6000 }
    );
  }, 10000);
});
