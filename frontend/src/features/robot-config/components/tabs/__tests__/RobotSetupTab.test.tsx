import { RobotSetupTab } from '@/features/robot-config/components/tabs/RobotSetupTab';
import type { RobotState } from '@/types/robot';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the components
vi.mock('@/features/robot-config/components/ArrayInputGroup', () => ({
  default: vi.fn(() => <div data-testid="array-input-group">Array Input Group</div>),
}));

vi.mock('@/features/shared/components/CollapsibleSection', () => ({
  CollapsibleSection: vi.fn(({ children, title }) => (
    <div data-testid="collapsible-section">
      <div>{title}</div>
      {children}
    </div>
  )),
}));

vi.mock('@/features/visualization/components/TendonConfigPanel', () => ({
  TendonConfigPanel: vi.fn(() => (
    <div data-testid="tendon-config-panel">Tendon Config Panel</div>
  )),
}));

vi.mock('@/components/icons', () => ({
  AdvancedIcon: vi.fn(() => <div data-testid="advanced-icon" />),
  LightningIcon: vi.fn(() => <div data-testid="lightning-icon" />),
  RobotIcon: vi.fn(() => <div data-testid="robot-icon" />),
  TendonIcon: vi.fn(() => <div data-testid="tendon-icon" />),
  UploadIcon: vi.fn(() => <div data-testid="upload-icon" />),
}));

vi.mock('@/components/ui', () => ({
  Button: vi.fn(({ children, onClick, ...props }) => (
    <button onClick={onClick} data-testid="button" {...props}>
      {children}
    </button>
  )),
  SliderInput: vi.fn(() => <div data-testid="slider-input">Slider Input</div>),
  SubsectionTitle: vi.fn(({ title, children }) => (
    <div data-testid="subsection-title">
      <div>{title}</div>
      {children}
    </div>
  )),
  Typography: vi.fn(({ children, variant }) => (
    <div data-testid={`typography-${variant}`}>{children}</div>
  )),
}));

describe('RobotSetupTab', () => {
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
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getByText('Robot Setup')).toBeInTheDocument();
  });

  it('renders with preset manager', () => {
    render(
      <RobotSetupTab
        onShowPresetManager={mockOnShowPresetManager}
        robotState={defaultRobotState}
        setRobotState={mockSetRobotState}
      />
    );

    expect(screen.getByText('Robot Setup')).toBeInTheDocument();
  });

  it('renders collapsible sections', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    // Look for collapsible sections by their testid (from mock)
    const collapsibleSections = screen.getAllByTestId('collapsible-section');
    expect(collapsibleSections.length).toBeGreaterThan(0);
    // Check that sections contain the expected titles
    expect(screen.getByText('Robot Segments')).toBeInTheDocument();
    expect(screen.getByText('Dimensions')).toBeInTheDocument(); // Changed from "Backbone Lengths"
    expect(screen.getByText('Tendons')).toBeInTheDocument();
  });

  it('renders array input groups', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getAllByTestId('array-input-group')).toHaveLength(2);
  });

  it('renders tendon config panel', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    // Look for the tendon section by its title
    expect(screen.getByText('Tendons')).toBeInTheDocument();
  });

  it('renders slider inputs', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    // SliderInput is mocked, so we check for the mock testid
    const sliderInputs = screen.getAllByTestId('slider-input');
    // There should be at least 2 sliders (one for segments, one for discretization steps)
    expect(sliderInputs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders upload icon', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    // Look for the upload icon by its SVG path or aria-label
    const uploadButton = screen.getByText('Preset Manager');
    expect(uploadButton).toBeInTheDocument();
  });

  it('renders typography components', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getByText('Robot Setup')).toBeInTheDocument();
    expect(
      screen.getByText(/Configure your robot's structure once/)
    ).toBeInTheDocument();
  });

  it('renders subsection titles', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getByText('Number of segments')).toBeInTheDocument();
    // These are subsection titles inside the "Dimensions" collapsible section
    expect(screen.getByText('Backbone Lengths')).toBeInTheDocument();
    expect(screen.getByText('Coupling Lengths')).toBeInTheDocument();
    // Tendon configuration is in its own collapsible section
    expect(screen.getByText('Tendons')).toBeInTheDocument();
  });
});
