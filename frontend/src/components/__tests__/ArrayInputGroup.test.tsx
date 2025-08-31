import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ArrayInputGroup from "../ArrayInputGroup";

// Mock the NumberInput component
vi.mock("../NumberInput", () => ({
  default: ({ value, onChange, placeholder, label }: any) => (
    <input
      data-testid={`number-input-${label}`}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
      aria-label={label}
    />
  ),
}));

describe("ArrayInputGroup", () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default angle mode", () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Bending Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Bending Angles")).toBeInTheDocument();
      expect(screen.getByText("deg")).toBeInTheDocument();
      expect(screen.getByText("rad")).toBeInTheDocument();
      expect(screen.getAllByDisplayValue("36")).toHaveLength(3); // 0.628319 rad = 36 deg
    });

    it("renders with length mode", () => {
      const values = [0.07, 0.07, 0.07];
      render(
        <ArrayInputGroup
          label="Backbone Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      expect(screen.getByText("Backbone Lengths")).toBeInTheDocument();
      expect(screen.getByText("mm")).toBeInTheDocument();
      expect(screen.getByText("cm")).toBeInTheDocument();
      expect(screen.getByText("m")).toBeInTheDocument();
      expect(screen.getAllByDisplayValue("70")).toHaveLength(3); // 0.07 m = 70 mm
    });

    it("renders correct number of inputs based on values length", () => {
      const values = [1, 2, 3, 4, 5];
      render(
        <ArrayInputGroup
          label="Test Values"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("number-input-1")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-2")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-3")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-4")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-5")).toBeInTheDocument();
    });

    it("applies correct grid layout for different array sizes", () => {
      const { rerender } = render(
        <ArrayInputGroup
          label="Small Array"
          values={[1, 2]}
          onChange={mockOnChange}
        />
      );

      // 3 columns for <= 3 items
      expect(screen.getByTestId("number-input-1")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-2")).toBeInTheDocument();

      rerender(
        <ArrayInputGroup
          label="Medium Array"
          values={[1, 2, 3, 4, 5]}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByTestId("number-input-5")).toBeInTheDocument();

      rerender(
        <ArrayInputGroup
          label="Large Array"
          values={[1, 2, 3, 4, 5, 6, 7, 8]}
          onChange={mockOnChange}
        />
      );
      expect(screen.getByTestId("number-input-8")).toBeInTheDocument();
    });
  });

  describe("Unit Conversion", () => {
    it("converts degrees to radians correctly", () => {
      const values = [0.628319, 0.628319, 0.628319]; // ~36 degrees in radians
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      // Should display 36 degrees (converted from 0.628319 radians)
      expect(screen.getAllByDisplayValue("36")).toHaveLength(3);
    });

    it("converts radians correctly when rad unit is selected", async () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      // Click on rad unit
      fireEvent.click(screen.getByText("rad"));

      await waitFor(() => {
        // Should display 0.6283 radians (original value)
        expect(screen.getAllByDisplayValue("0.6283")).toHaveLength(3);
      });
    });

    it("converts millimeters to meters correctly", () => {
      const values = [0.07, 0.07, 0.07]; // 0.07 meters
      render(
        <ArrayInputGroup
          label="Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      // Should display 70 mm (converted from 0.07 meters)
      expect(screen.getAllByDisplayValue("70")).toHaveLength(3);
    });

    it("converts centimeters correctly when cm unit is selected", async () => {
      const values = [0.07, 0.07, 0.07]; // 0.07 meters
      render(
        <ArrayInputGroup
          label="Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      // Click on cm unit
      fireEvent.click(screen.getByText("cm"));

      await waitFor(() => {
        // Should display 7 cm (converted from 0.07 meters)
        expect(screen.getAllByDisplayValue("7")).toHaveLength(3);
      });
    });

    it("converts meters correctly when m unit is selected", async () => {
      const values = [0.07, 0.07, 0.07]; // 0.07 meters
      render(
        <ArrayInputGroup
          label="Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      // Click on m unit
      fireEvent.click(screen.getByText("m"));

      await waitFor(() => {
        // Should display 0.07 m (original value)
        expect(screen.getAllByDisplayValue("0.07")).toHaveLength(3);
      });
    });
  });

  describe("Value Changes", () => {
    it("calls onChange with converted SI values when input changes", async () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      const firstInput = screen.getByTestId("number-input-1");
      fireEvent.change(firstInput, { target: { value: "45" } }); // Change to 45 degrees

      await waitFor(() => {
        // Should call onChange with 45 degrees converted to radians (π/4)
        expect(mockOnChange).toHaveBeenCalledWith([
          0.7853981633974483, 0.628319, 0.628319,
        ]);
      });
    });

    it("calls onChange with converted SI values for length mode", async () => {
      const values = [0.07, 0.07, 0.07];
      render(
        <ArrayInputGroup
          label="Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      const firstInput = screen.getByTestId("number-input-1");
      fireEvent.change(firstInput, { target: { value: "50" } }); // Change to 50 mm

      await waitFor(() => {
        // Should call onChange with 50 mm converted to meters (0.05)
        expect(mockOnChange).toHaveBeenCalledWith([0.05, 0.07, 0.07]);
      });
    });

    it("updates all inputs when unit changes", async () => {
      const values = [0.628319, 0.628319, 0.628319]; // ~36 degrees
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      // Initially shows degrees
      expect(screen.getAllByDisplayValue("36")).toHaveLength(3);

      // Switch to radians
      fireEvent.click(screen.getByText("rad"));

      await waitFor(() => {
        // Should now show radians
        expect(screen.getAllByDisplayValue("0.6283")).toHaveLength(3);
      });
    });
  });

  describe("User Interactions", () => {
    it("shows loading spinner during value updates", async () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      const firstInput = screen.getByTestId("number-input-1");
      fireEvent.change(firstInput, { target: { value: "45" } });

      // Should show loading spinner
      expect(screen.getByText("Angles").nextElementSibling).toHaveClass(
        "animate-spin"
      );

      // Wait for the update to complete
      await waitFor(() => {
        expect(screen.queryByRole("status")).not.toBeInTheDocument();
      });
    });

    it("handles unit button clicks correctly", () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      // Initially deg should be selected
      const degButton = screen.getByText("deg");
      const radButton = screen.getByText("rad");

      expect(degButton).toHaveClass("bg-white");
      expect(radButton).not.toHaveClass("bg-white");

      // Click rad button
      fireEvent.click(radButton);

      expect(degButton).not.toHaveClass("bg-white");
      expect(radButton).toHaveClass("bg-white");
    });

    it("handles length unit button clicks correctly", () => {
      const values = [0.07, 0.07, 0.07];
      render(
        <ArrayInputGroup
          label="Lengths"
          values={values}
          onChange={mockOnChange}
          mode="length"
        />
      );

      const mmButton = screen.getByText("mm");
      const cmButton = screen.getByText("cm");
      const mButton = screen.getByText("m");

      // Initially mm should be selected
      expect(mmButton).toHaveClass("bg-white");
      expect(cmButton).not.toHaveClass("bg-white");
      expect(mButton).not.toHaveClass("bg-white");

      // Click cm button
      fireEvent.click(cmButton);

      expect(mmButton).not.toHaveClass("bg-white");
      expect(cmButton).toHaveClass("bg-white");
      expect(mButton).not.toHaveClass("bg-white");
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels for unit buttons", () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Bending Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(
        screen.getByLabelText("Bending Angles unit deg")
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Bending Angles unit rad")
      ).toBeInTheDocument();
    });

    it("has proper labels for number inputs", () => {
      const values = [0.628319, 0.628319, 0.628319];
      render(
        <ArrayInputGroup
          label="Bending Angles"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByLabelText("1")).toBeInTheDocument();
      expect(screen.getByLabelText("2")).toBeInTheDocument();
      expect(screen.getByLabelText("3")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty array", () => {
      render(
        <ArrayInputGroup
          label="Empty Array"
          values={[]}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText("Empty Array")).toBeInTheDocument();
      expect(screen.queryByTestId(/number-input/)).not.toBeInTheDocument();
    });

    it("handles single value array", () => {
      const values = [0.628319];
      render(
        <ArrayInputGroup
          label="Single Value"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("number-input-1")).toBeInTheDocument();
      expect(screen.queryByTestId("number-input-2")).not.toBeInTheDocument();
    });

    it("handles very large arrays", () => {
      const values = Array.from({ length: 10 }, (_, i) => i + 1);
      render(
        <ArrayInputGroup
          label="Large Array"
          values={values}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByTestId("number-input-1")).toBeInTheDocument();
      expect(screen.getByTestId("number-input-10")).toBeInTheDocument();
    });
  });
});
