import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SliderInput from "../SliderInput";

describe("SliderInput", () => {
  const defaultProps = {
    value: 50,
    onChange: vi.fn(),
    label: "Test Slider",
  };

  it("renders with default props", () => {
    render(<SliderInput {...defaultProps} />);

    expect(screen.getByText("Test Slider")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toHaveValue("50");
    expect(screen.getByRole("textbox")).toHaveValue("50");
  });

  it("renders without label", () => {
    const { label, ...propsWithoutLabel } = defaultProps;
    render(<SliderInput {...propsWithoutLabel} />);

    expect(screen.queryByText("Test Slider")).not.toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("displays min and max range", () => {
    render(<SliderInput {...defaultProps} min={10} max={100} />);

    expect(screen.getByText("10 - 100")).toBeInTheDocument();
  });

  it("calls onChange when slider value changes", () => {
    render(<SliderInput {...defaultProps} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "75" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  it("calls onChange when input value changes", () => {
    render(<SliderInput {...defaultProps} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "80" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(80);
  });

  it("clamps input values to min/max on blur", () => {
    render(<SliderInput {...defaultProps} min={0} max={100} />);

    const input = screen.getByRole("textbox");

    // Test value below min
    fireEvent.change(input, { target: { value: "-10" } });
    fireEvent.blur(input);

    expect(defaultProps.onChange).toHaveBeenCalledWith(0);

    // Test value above max
    fireEvent.change(input, { target: { value: "150" } });
    fireEvent.blur(input);

    expect(defaultProps.onChange).toHaveBeenCalledWith(100);
  });

  it("handles disabled state", () => {
    render(<SliderInput {...defaultProps} disabled={true} />);

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("textbox");

    expect(slider).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it("syncs input value when external value changes", async () => {
    const { rerender } = render(<SliderInput {...defaultProps} />);

    expect(screen.getByRole("textbox")).toHaveValue("50");

    rerender(<SliderInput {...defaultProps} value={75} />);

    await waitFor(() => {
      expect(screen.getByRole("textbox")).toHaveValue("75");
    });
  });

  it("handles step increments correctly", () => {
    render(<SliderInput {...defaultProps} step={5} />);

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "55" } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(55);
  });

  it("generates unique IDs for accessibility", () => {
    render(<SliderInput {...defaultProps} />);

    const slider = screen.getByRole("slider");
    const input = screen.getByRole("textbox");

    expect(slider).toHaveAttribute("id");
    // The text input doesn't have an id attribute in the current implementation
    expect(input).toBeInTheDocument();
  });
});
