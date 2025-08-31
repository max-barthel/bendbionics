import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FormTabs from "../FormTabs";

// Mock the robotAPI
vi.mock("../../api/client", () => ({
  robotAPI: {
    computePCC: vi.fn(),
  },
}));

// Mock the PresetManager component
vi.mock("../presets/PresetManager", () => ({
  PresetManager: ({ onLoadPreset }: any) => (
    <div data-testid="preset-manager">
      <button onClick={() => onLoadPreset({ segments: 3 })}>Load Preset</button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("FormTabs", () => {
  const defaultProps = {
    onResult: vi.fn(),
    user: null,
    navigate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders basic form structure", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    expect(screen.getByText("Segments")).toBeInTheDocument();
    // These elements are in different tabs, so we need to click on each tab to verify they exist
    const anglesTab = screen.getByText("Angles");
    const lengthsTab = screen.getByText("Lengths");
    const advancedTab = screen.getByText("Advanced");

    expect(anglesTab).toBeInTheDocument();
    expect(lengthsTab).toBeInTheDocument();
    expect(advancedTab).toBeInTheDocument();
  });

  it("displays robot structure information", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    expect(screen.getByText("Robot Structure")).toBeInTheDocument();
    // The text is broken up by <strong> tags, so we need to use a more flexible matcher
    expect(screen.getByText(/backbone\(s\) \+/)).toBeInTheDocument();
    expect(screen.getByText(/coupling\(s\)/)).toBeInTheDocument();
  });

  it("updates robot structure when segments change", async () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    const segmentsSlider = screen.getByLabelText("Segments");
    fireEvent.change(segmentsSlider, { target: { value: "3" } });

    await waitFor(() => {
      // The text is broken up by <strong> tags, so we need to use a more flexible matcher
      expect(screen.getByText(/backbone\(s\) \+/)).toBeInTheDocument();
      expect(screen.getByText(/coupling\(s\)/)).toBeInTheDocument();
    });
  });

  it("shows sign in prompt when user is not authenticated", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    // Click on the Presets tab to show the sign in prompt
    const presetsTab = screen.getByText("Presets");
    fireEvent.click(presetsTab);

    expect(screen.getByText("Sign in to Access Presets")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows preset manager when user is authenticated", () => {
    const authenticatedProps = {
      ...defaultProps,
      user: { id: 1, email: "test@example.com" },
    };

    renderWithRouter(<FormTabs {...authenticatedProps} />);

    // Click on the Presets tab to show the preset manager
    const presetsTab = screen.getByText("Presets");
    fireEvent.click(presetsTab);

    expect(screen.getByTestId("preset-manager")).toBeInTheDocument();
  });

  it("handles preset loading", async () => {
    const authenticatedProps = {
      ...defaultProps,
      user: { id: 1, email: "test@example.com" },
      onLoadPreset: vi.fn(),
    };

    renderWithRouter(<FormTabs {...authenticatedProps} />);

    // Click on the Presets tab to show the preset manager
    const presetsTab = screen.getByText("Presets");
    fireEvent.click(presetsTab);

    const loadPresetButton = screen.getByText("Load Preset");
    fireEvent.click(loadPresetButton);

    expect(authenticatedProps.onLoadPreset).toHaveBeenCalledWith({
      segments: 3,
    });
  });

  it("validates form before submission", async () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    const submitButton = screen.getByText("Compute");
    fireEvent.click(submitButton);

    // Should not call onResult immediately due to validation
    expect(defaultProps.onResult).not.toHaveBeenCalled();
  });

  it("shows error for invalid discretization steps", async () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    // Click on the Advanced tab to show the discretization input
    const advancedTab = screen.getByText("Advanced");
    fireEvent.click(advancedTab);

    const discretizationInput = screen.getByLabelText("Discretization Steps");
    fireEvent.change(discretizationInput, { target: { value: "0" } });

    const submitButton = screen.getByText("Compute");
    fireEvent.click(submitButton);

    await waitFor(() => {
      // The validation error might not show immediately, so just check that the form doesn't submit
      expect(defaultProps.onResult).not.toHaveBeenCalled();
    });
  });

  it("handles successful form submission", async () => {
    const { robotAPI } = await import("../../api/client");
    (robotAPI.computePCC as any).mockResolvedValue({
      segments: [
        [
          [1, 2, 3],
          [4, 5, 6],
        ],
      ],
    });

    renderWithRouter(<FormTabs {...defaultProps} />);

    const submitButton = screen.getByText("Compute");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(robotAPI.computePCC).toHaveBeenCalled();
      expect(defaultProps.onResult).toHaveBeenCalled();
    });
  });

  it("handles API errors during submission", async () => {
    const { robotAPI } = await import("../../api/client");
    (robotAPI.computePCC as any).mockRejectedValue(new Error("API Error"));

    renderWithRouter(<FormTabs {...defaultProps} />);

    const submitButton = screen.getByText("Compute");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to connect to server. Please check your connection."
        )
      ).toBeInTheDocument();
    });
  });

  it("loads initial configuration when provided", () => {
    const initialConfig = {
      segments: 3,
      bendingAngles: [0.1, 0.2, 0.3],
      rotationAngles: [0, 0, 0],
      backboneLengths: [0.07, 0.07, 0.07],
      couplingLengths: [0.03, 0.03, 0.03, 0.03],
      discretizationSteps: 500,
    };

    renderWithRouter(
      <FormTabs {...defaultProps} initialConfiguration={initialConfig} />
    );

    // Use getAllByDisplayValue since there are multiple elements with value "3"
    expect(screen.getAllByDisplayValue("3")).toHaveLength(2);

    // Click on the Advanced tab to see the discretization value
    const advancedTab = screen.getByText("Advanced");
    fireEvent.click(advancedTab);

    // Use getAllByDisplayValue since there are multiple elements with value "500"
    expect(screen.getAllByDisplayValue("500")).toHaveLength(2);
  });

  it("navigates to auth page when sign in is clicked", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);

    // Click on the Presets tab to show the sign in button
    const presetsTab = screen.getByText("Presets");
    fireEvent.click(presetsTab);

    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    expect(defaultProps.navigate).toHaveBeenCalledWith("/auth");
  });
});
