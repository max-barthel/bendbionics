import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TendonConfigPanel } from "../TendonConfigPanel";

// Mock the UI components
vi.mock("../ui", () => ({
  Input: ({ id, type, value, onChange, placeholder }: any) => (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      placeholder={placeholder}
      data-testid="input"
    />
  ),
  NumberInput: ({ value, onChange, label, placeholder }: any) => (
    <div data-testid="number-input">
      <label>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        placeholder={placeholder}
      />
    </div>
  ),
  SliderInput: ({ value, onChange, min, max, step, label, className }: any) => (
    <div data-testid="slider-input" className={className}>
      <label>{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid="slider"
      />
      <span data-testid="slider-value">{value}</span>
    </div>
  ),
  SubsectionTitle: ({ title, description }: any) => (
    <div data-testid="subsection-title">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
  UnitSelector: ({ units, selectedUnit, onUnitChange, ariaLabel }: any) => (
    <div data-testid="unit-selector">
      <label>{ariaLabel}</label>
      <select
        value={selectedUnit}
        onChange={(e) => onUnitChange(e.target.value)}
        data-testid="unit-select"
      >
        {units.map((unit: string) => (
          <option key={unit} value={unit}>
            {unit}
          </option>
        ))}
      </select>
    </div>
  ),
}));

describe("TendonConfigPanel", () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    tendonConfig: {
      count: 3,
      radius: 0.01,
      coupling_offset: 0.0,
    },
    onConfigChange: mockOnChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tendon configuration panel", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    const subsectionTitles = screen.getAllByTestId("subsection-title");
    expect(subsectionTitles).toHaveLength(3);
    expect(screen.getByText("Tendon Count")).toBeInTheDocument();
  });

  it("displays current tendon configuration values", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    // Count is displayed in slider
    expect(screen.getByTestId("slider-value")).toHaveTextContent("3");

    // Radius is converted to mm (0.01 * 1000 = 10)
    const radiusInput = screen.getByDisplayValue("10");
    expect(radiusInput).toBeInTheDocument();

    // Offset is converted to mm (0 * 1000 = 0)
    const offsetInput = screen.getByDisplayValue("0");
    expect(offsetInput).toBeInTheDocument();
  });

  it("handles tendon count changes", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    const slider = screen.getByTestId("slider");
    fireEvent.change(slider, { target: { value: "4" } });

    expect(mockOnChange).toHaveBeenCalledWith({
      count: 4,
      radius: 0.01,
      coupling_offset: 0.0,
    });
  });

  it("handles radius changes", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    // Radius is displayed in mm (0.01 * 1000 = 10)
    const radiusInput = screen.getByDisplayValue("10");
    fireEvent.change(radiusInput, { target: { value: "20" } });

    // 20 mm = 0.02 m
    expect(mockOnChange).toHaveBeenCalledWith({
      count: 3,
      radius: 0.02,
      coupling_offset: 0.0,
    });
  });

  it("handles coupling offset changes", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    // Offset is displayed in mm (0 * 1000 = 0)
    const offsetInput = screen.getByDisplayValue("0");
    fireEvent.change(offsetInput, { target: { value: "5" } });

    // 5 mm = 0.005 m
    expect(mockOnChange).toHaveBeenCalledWith({
      count: 3,
      radius: 0.01,
      coupling_offset: 0.005,
    });
  });

  it("shows correct labels for all inputs", () => {
    render(<TendonConfigPanel {...defaultProps} />);

    expect(screen.getByText("Tendon Count")).toBeInTheDocument();
    const radiusElements = screen.getAllByText("Radius");
    expect(radiusElements.length).toBeGreaterThan(0);
    const offsetElements = screen.getAllByText("Vertical Offset");
    expect(offsetElements.length).toBeGreaterThan(0);
  });
});
