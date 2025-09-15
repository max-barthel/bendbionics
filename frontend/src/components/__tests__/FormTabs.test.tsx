import { render, screen } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

// Mock all the problematic hooks and components
vi.mock("../../hooks/useRobotState", () => ({
  useRobotState: () => [
    {
      segments: 3,
      bendingAngles: [0, 0, 0],
      rotationAngles: [0, 0, 0],
      backboneLengths: [0.07, 0.07, 0.07],
      couplingLengths: [0.03, 0.03, 0.03, 0.03],
      discretizationSteps: 1000,
      tendonConfig: { count: 3, radius: 0.01, coupling_offset: 0 }
    },
    vi.fn()
  ]
}));

vi.mock("../../hooks/useErrorHandler", () => ({
  useErrorHandler: () => ({
    error: { visible: false, message: "" },
    showError: vi.fn(),
    hideError: vi.fn()
  })
}));

vi.mock("../../hooks/useConfigurationLoader", () => ({
  useConfigurationLoader: () => ({})
}));

vi.mock("../../utils/formValidation", () => ({
  validateRobotConfiguration: vi.fn().mockResolvedValue(true)
}));

vi.mock("../../api/client", () => ({
  robotAPI: {
    computePCC: vi.fn(),
    computePCCWithTendons: vi.fn(),
  },
}));

vi.mock("../ErrorDisplay", () => ({
  ErrorDisplay: () => <div>Error Display</div>
}));

vi.mock("../icons", () => ({
  ControlIcon: () => <div>ControlIcon</div>,
  RobotIcon: () => <div>RobotIcon</div>
}));

vi.mock("../tabs/ControlTab", () => ({
  ControlTab: () => <div>Control Tab</div>
}));

vi.mock("../tabs/RobotSetupTab", () => ({
  RobotSetupTab: () => <div>Robot Setup Tab</div>
}));

vi.mock("../ui", () => ({
  TabPanel: ({ children }: any) => <div>{children}</div>,
  Tabs: ({ tabs }: any) => (
    <div>
      {tabs.map((tab: any) => (
        <button key={tab.id}>{tab.label}</button>
      ))}
    </div>
  )
}));

// Import FormTabs after mocking
import FormTabs from "../FormTabs";

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe("FormTabs - Simple Tests", () => {
  const defaultProps = {
    onResult: vi.fn(),
    user: null,
    navigate: vi.fn(),
  };

  it("renders without crashing", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);
    expect(screen.getByText("Robot Setup")).toBeInTheDocument();
    expect(screen.getByText("Control")).toBeInTheDocument();
  });

  it("renders robot setup tab content", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);
    expect(screen.getByText("Robot Setup Tab")).toBeInTheDocument();
  });

  it("renders control tab content", () => {
    renderWithRouter(<FormTabs {...defaultProps} />);
    expect(screen.getByText("Control Tab")).toBeInTheDocument();
  });
});
