import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProgressIndicator from "../ProgressIndicator";

describe("ProgressIndicator", () => {
  it("renders with default message", () => {
    render(<ProgressIndicator progress={50} />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("renders with custom message", () => {
    render(<ProgressIndicator progress={75} message="Custom progress" />);

    expect(screen.getByText("Custom progress")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("displays correct progress percentage", () => {
    render(<ProgressIndicator progress={33.7} />);

    expect(screen.getByText("34%")).toBeInTheDocument(); // Math.round(33.7) = 34
  });

  it("displays 0% for zero progress", () => {
    render(<ProgressIndicator progress={0} />);

    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays 100% for full progress", () => {
    render(<ProgressIndicator progress={100} />);

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<ProgressIndicator progress={50} className="custom-class" />);

    const container = screen
      .getByText("Processing...")
      .closest("div")?.parentElement;
    expect(container).toHaveClass("custom-class");
  });

  it("has correct container structure", () => {
    render(<ProgressIndicator progress={50} />);

    const container = screen
      .getByText("Processing...")
      .closest("div")?.parentElement;
    expect(container).toHaveClass("w-full");
  });

  it("has correct progress bar structure", () => {
    render(<ProgressIndicator progress={50} />);

    const progressBar = screen
      .getByText("50%")
      .closest("div")?.nextElementSibling;
    expect(progressBar).toHaveClass(
      "w-full",
      "bg-gray-200",
      "rounded-full",
      "h-2"
    );
  });

  it("has correct progress fill styling", () => {
    render(<ProgressIndicator progress={50} />);

    const progressFill = screen.getByText("50%").closest("div")
      ?.nextElementSibling?.firstElementChild;
    expect(progressFill).toHaveClass(
      "bg-blue-600",
      "h-2",
      "rounded-full",
      "transition-all",
      "duration-300",
      "ease-out"
    );
  });

  it("handles decimal progress values correctly", () => {
    render(<ProgressIndicator progress={66.6} />);

    expect(screen.getByText("67%")).toBeInTheDocument(); // Math.round(66.6) = 67
  });
});
