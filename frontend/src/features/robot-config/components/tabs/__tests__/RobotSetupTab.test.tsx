import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type RobotState } from '../../../hooks/useRobotState';
import { RobotSetupTab } from '../RobotSetupTab';

// Mock the components
vi.mock('../../ArrayInputGroup', () => ({
  default: vi.fn(() => <div data-testid="array-input-group">Array Input Group</div>),
}));

vi.mock('../../../shared/components/CollapsibleSection', () => ({
  CollapsibleSection: vi.fn(({ children, title }) => (
    <div data-testid="collapsible-section">
      <div>{title}</div>
      {children}
    </div>
  )),
}));

vi.mock('../../../visualization/components/TendonConfigPanel', () => ({
  TendonConfigPanel: vi.fn(() => (
    <div data-testid="tendon-config-panel">Tendon Config Panel</div>
  )),
}));

vi.mock('../../../../components/icons', () => ({
  AdvancedIcon: vi.fn(() => <div data-testid="advanced-icon" />),
  LightningIcon: vi.fn(() => <div data-testid="lightning-icon" />),
  RobotIcon: vi.fn(() => <div data-testid="robot-icon" />),
  TendonIcon: vi.fn(() => <div data-testid="tendon-icon" />),
  UploadIcon: vi.fn(() => <div data-testid="upload-icon" />),
}));

vi.mock('../../../../components/ui', () => ({
  SliderInput: vi.fn(() => <div data-testid="slider-input">Slider Input</div>),
  SubsectionTitle: vi.fn(({ children }) => (
    <div data-testid="subsection-title">{children}</div>
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
      coupling_offset: 0.0,
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

    expect(screen.getAllByTestId('collapsible-section')).toHaveLength(4);
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

    expect(screen.getByTestId('tendon-config-panel')).toBeInTheDocument();
  });

  it('renders slider inputs', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getAllByTestId('slider-input')).toHaveLength(2);
  });

  it('renders upload icon', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
  });

  it('renders typography components', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getByTestId('typography-h4')).toBeInTheDocument();
    expect(screen.getByTestId('typography-body')).toBeInTheDocument();
  });

  it('renders subsection titles', () => {
    render(
      <RobotSetupTab robotState={defaultRobotState} setRobotState={mockSetRobotState} />
    );

    expect(screen.getAllByTestId('subsection-title')).toHaveLength(4);
  });
});
