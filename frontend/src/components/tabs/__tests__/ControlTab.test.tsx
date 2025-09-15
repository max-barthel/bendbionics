import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type RobotState } from "../../../hooks/useRobotState";
import { ControlTab } from "../ControlTab";

// Mock the components
vi.mock("../../AngleControlPanel", () => ({
  AngleControlPanel: vi.fn(() => (
    <div data-testid="angle-control-panel">Angle Control Panel</div>
  )),
}));

vi.mock("../../CollapsibleSection", () => ({
  CollapsibleSection: vi.fn(({ children, title }) => (
    <div data-testid="collapsible-section">
      <div>{title}</div>
      {children}
    </div>
  )),
}));

vi.mock("../../icons", () => ({
  BendingIcon: vi.fn(() => <div data-testid="bending-icon" />),
  RotationIcon: vi.fn(() => <div data-testid="rotation-icon" />),
  UploadIcon: vi.fn(() => <div data-testid="upload-icon" />),
}));

vi.mock("../../ui", () => ({
  Typography: vi.fn(({ children, variant }) => (
    <div data-testid={`typography-${variant}`}>{children}</div>
  )),
}));

describe("ControlTab", () => {
  const mockSetRobotState = vi.fn();
  const mockOnShowPresetManager = vi.fn();

  const defaultRobotState: RobotState = {
    segments: 2,
    bendingAngles: [0, 0],
    rotationAngles: [0, 0],
    backboneLengths: [0.07, 0.07],
    couplingLengths: [0.03, 0.03, 0.03],
    discretizationSteps: 1000,
    tendonConfig: {
      count: 3,
      radius: 0.01,
      coupling_offset: 0.0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with default props", () => {
    render(
      <ControlTab
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getByText("Robot Control")).toBeInTheDocument();
    expect(screen.getByText("Bending Angles")).toBeInTheDocument();
    expect(screen.getByText("Rotation Angles")).toBeInTheDocument();
  });

  it("renders with user and preset manager", () => {
    render(
      <ControlTab
        user={{ name: "Test User" }}
        onShowPresetManager={mockOnShowPresetManager}
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getByText("Robot Control")).toBeInTheDocument();
  });

  it("renders collapsible sections", () => {
    render(
      <ControlTab
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getAllByTestId("collapsible-section")).toHaveLength(2);
  });

  it("renders angle control panels", () => {
    render(
      <ControlTab
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getAllByTestId("angle-control-panel")).toHaveLength(2);
  });

  it("renders upload icon", () => {
    render(
      <ControlTab
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
  });

  it("renders typography components", () => {
    render(
      <ControlTab
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getByTestId("typography-h4")).toBeInTheDocument();
    expect(screen.getByTestId("typography-body")).toBeInTheDocument();
  });
});
