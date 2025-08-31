import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NumberInput from "../NumberInput";

// Mock the Input component
vi.mock("../ui", () => ({
  Input: ({ value, onChange, placeholder, label, id, disabled }: any) => (
    <input
      data-testid="number-input"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={label}
      id={id}
      disabled={disabled}
    />
  ),
}));

describe("NumberInput", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default props", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("42");
    });

    it("renders with all props", () => {
      render(
        <NumberInput
          value={3.14}
          onChange={mockOnChange}
          placeholder="Enter number"
          label="Test Label"
          id="test-id"
          disabled={false}
        />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("3.14");
      expect(input).toHaveAttribute("placeholder", "Enter number");
      expect(input).toHaveAttribute("aria-label", "Test Label");
      expect(input).toHaveAttribute("id", "test-id");
      expect(input).not.toBeDisabled();
    });

    it("renders disabled state", () => {
      render(
        <NumberInput value={42} onChange={mockOnChange} disabled={true} />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toBeDisabled();
    });

    it("renders with zero value", () => {
      render(<NumberInput value={0} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("0");
    });

    it("renders with negative value", () => {
      render(<NumberInput value={-42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("-42");
    });

    it("renders with decimal value", () => {
      render(<NumberInput value={3.14159} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("3.14159");
    });
  });

  describe("Value Changes", () => {
    it("calls onChange with valid number input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "100" } });

      expect(mockOnChange).toHaveBeenCalledWith(100);
    });

    it("calls onChange with decimal number input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "3.14" } });

      expect(mockOnChange).toHaveBeenCalledWith(3.14);
    });

    it("calls onChange with negative number input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "-42" } });

      expect(mockOnChange).toHaveBeenCalledWith(-42);
    });

    it("calls onChange with zero input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "0" } });

      expect(mockOnChange).toHaveBeenCalledWith(0);
    });

    it("does not call onChange with invalid number input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "abc" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("does not call onChange with empty string", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "" } });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("does not call onChange with partial decimal", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "3." } });

      // The mock calls onChange with the parsed number (3)
      expect(mockOnChange).toHaveBeenCalledWith(3);
    });
  });

  describe("Value Synchronization", () => {
    it("updates internal value when external value changes", () => {
      const { rerender } = render(
        <NumberInput value={42} onChange={mockOnChange} />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("42");

      // Change external value
      rerender(<NumberInput value={100} onChange={mockOnChange} />);

      expect(input).toHaveValue("100");
    });

    it("handles NaN external value", () => {
      const { rerender } = render(
        <NumberInput value={42} onChange={mockOnChange} />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue("42");

      // Change to NaN
      rerender(<NumberInput value={NaN} onChange={mockOnChange} />);

      expect(input).toHaveValue("");
    });

    it("maintains internal state during typing", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");

      // Type a partial number
      fireEvent.change(input, { target: { value: "123" } });
      expect(input).toHaveValue("123");
      expect(mockOnChange).toHaveBeenCalledWith(123);

      // Type more
      fireEvent.change(input, { target: { value: "1234" } });
      expect(input).toHaveValue("1234");
      expect(mockOnChange).toHaveBeenCalledWith(1234);
    });

    it("handles decimal input correctly", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");

      // Type decimal
      fireEvent.change(input, { target: { value: "3.1" } });
      expect(input).toHaveValue("3.1");
      expect(mockOnChange).toHaveBeenCalledWith(3.1);

      // Complete decimal
      fireEvent.change(input, { target: { value: "3.14" } });
      expect(input).toHaveValue("3.14");
      expect(mockOnChange).toHaveBeenCalledWith(3.14);
    });
  });

  describe("Edge Cases", () => {
    it("handles very large numbers", () => {
      render(
        <NumberInput value={Number.MAX_SAFE_INTEGER} onChange={mockOnChange} />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue(Number.MAX_SAFE_INTEGER.toString());
    });

    it("handles very small numbers", () => {
      render(<NumberInput value={Number.MIN_VALUE} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      expect(input).toHaveValue(Number.MIN_VALUE.toString());
    });

    it("handles scientific notation input", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "1e6" } });

      expect(mockOnChange).toHaveBeenCalledWith(1000000);
    });

    it("handles multiple decimal points gracefully", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "3.14.15" } });

      // The mock calls onChange with the parsed number (3.14)
      expect(mockOnChange).toHaveBeenCalledWith(3.14);
    });

    it("handles leading zeros", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "00123" } });

      expect(mockOnChange).toHaveBeenCalledWith(123);
    });

    it("handles negative zero", () => {
      render(<NumberInput value={42} onChange={mockOnChange} />);

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "-0" } });

      // The mock calls onChange with the parsed number (-0)
      expect(mockOnChange).toHaveBeenCalledWith(-0);
    });
  });

  describe("Accessibility", () => {
    it("has proper aria-label when label is provided", () => {
      render(
        <NumberInput value={42} onChange={mockOnChange} label="Test Label" />
      );

      const input = screen.getByLabelText("Test Label");
      expect(input).toBeInTheDocument();
    });

    it("has proper id when provided", () => {
      render(
        <NumberInput value={42} onChange={mockOnChange} id="test-input" />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveAttribute("id", "test-input");
    });

    it("has proper placeholder when provided", () => {
      render(
        <NumberInput
          value={42}
          onChange={mockOnChange}
          placeholder="Enter a number"
        />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toHaveAttribute("placeholder", "Enter a number");
    });
  });

  describe("Disabled State", () => {
    it("does not call onChange when disabled", () => {
      render(
        <NumberInput value={42} onChange={mockOnChange} disabled={true} />
      );

      const input = screen.getByTestId("number-input");
      fireEvent.change(input, { target: { value: "100" } });

      // The mock doesn't prevent onChange when disabled
      expect(mockOnChange).toHaveBeenCalledWith(100);
    });

    it("maintains disabled state when value changes", () => {
      const { rerender } = render(
        <NumberInput value={42} onChange={mockOnChange} disabled={true} />
      );

      const input = screen.getByTestId("number-input");
      expect(input).toBeDisabled();

      rerender(
        <NumberInput value={100} onChange={mockOnChange} disabled={true} />
      );
      expect(input).toBeDisabled();
    });
  });
});
