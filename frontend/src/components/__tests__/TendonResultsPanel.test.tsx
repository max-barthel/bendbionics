import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TendonResultsPanel } from "../TendonResultsPanel";

// Mock the UI components
vi.mock("../ui", () => ({
  Typography: ({ children, variant, color, className }: any) => (
    <span className={`typography-${variant} typography-${color} ${className}`}>
      {children}
    </span>
  ),
}));

describe("TendonResultsPanel", () => {
  const mockOnToggle = vi.fn();

  const mockTendonAnalysis = {
    actuation_commands: {
      "1": {
        length_change_m: 0.01,
        pull_direction: "pull",
        magnitude: 1.0,
      },
      "2": {
        length_change_m: -0.005,
        pull_direction: "release",
        magnitude: 0.5,
      },
      "3": {
        length_change_m: 0,
        pull_direction: "hold",
        magnitude: 0,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders toggle button when no data is available", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={undefined}
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByLabelText("Show tendon results")).toBeInTheDocument();
  });

  it("renders folded card when data is available but not visible", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={mockTendonAnalysis}
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    // Use getAllByText to handle multiple elements
    const tendon1Elements = screen.getAllByText("Tendon 1");
    expect(tendon1Elements.length).toBeGreaterThan(0);
    const lengthElements = screen.getAllByText("+10.00 mm");
    expect(lengthElements.length).toBeGreaterThan(0);
    const pullElements = screen.getAllByText("pull");
    expect(pullElements.length).toBeGreaterThan(0);
  });

  it("renders full panel when visible", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={mockTendonAnalysis}
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText("Tendon 1")).toBeInTheDocument();
    expect(screen.getByText("Tendon 2")).toBeInTheDocument();
    expect(screen.getByText("Tendon 3")).toBeInTheDocument();

    expect(screen.getByText("+10.00 mm")).toBeInTheDocument();
    expect(screen.getByText("-5.00 mm")).toBeInTheDocument();
    expect(screen.getByText("0.00 mm")).toBeInTheDocument();
  });

  it("calls onToggle when toggle button is clicked", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={mockTendonAnalysis}
        isVisible={false}
        onToggle={mockOnToggle}
      />
    );

    const toggleButton = screen.getByLabelText("Show tendon results");
    fireEvent.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it("calls onToggle when close button is clicked", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={mockTendonAnalysis}
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    const closeButton = screen.getByLabelText("Close tendon results");
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it("formats length changes correctly", () => {
    const analysisWithDecimals = {
      actuation_commands: {
        "1": {
          length_change_m: 0.123456,
          pull_direction: "pull",
          magnitude: 1.0,
        },
      },
    };

    render(
      <TendonResultsPanel
        tendonAnalysis={analysisWithDecimals}
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText("+123.46 mm")).toBeInTheDocument();
  });

  it("shows correct pull direction icons and text", () => {
    render(
      <TendonResultsPanel
        tendonAnalysis={mockTendonAnalysis}
        isVisible={true}
        onToggle={mockOnToggle}
      />
    );

    expect(screen.getByText("pull")).toBeInTheDocument();
    expect(screen.getByText("release")).toBeInTheDocument();
    expect(screen.getByText("hold")).toBeInTheDocument();
  });
});
