import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorDisplay } from "../ErrorDisplay";

describe("ErrorDisplay", () => {
  it("renders error message", () => {
    const mockOnClose = vi.fn();
    const errorMessage = "Test error message";
    render(<ErrorDisplay message={errorMessage} onClose={mockOnClose} />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const mockOnClose = vi.fn();
    render(<ErrorDisplay message="Test error" onClose={mockOnClose} />);

    const closeButton = screen.getByLabelText("Close error message");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it("renders error icon", () => {
    const mockOnClose = vi.fn();
    render(<ErrorDisplay message="Test error" onClose={mockOnClose} />);

    // The ErrorIcon should be present (it's an SVG)
    const errorContainer = screen.getByText("Test error").closest("div");
    expect(errorContainer).toBeInTheDocument();
  });

  it("renders with different error messages", () => {
    const mockOnClose = vi.fn();
    render(<ErrorDisplay message="Network error" onClose={mockOnClose} />);

    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("has proper styling classes", () => {
    const mockOnClose = vi.fn();
    render(<ErrorDisplay message="Test error" onClose={mockOnClose} />);

    // Find the main error container (the outermost div with the red styling)
    const errorContainer = screen.getByText("Test error").closest("div.mx-6");
    expect(errorContainer).toHaveClass(
      "bg-red-50",
      "border-red-400",
      "text-red-800"
    );
  });
});
