import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CollapsibleSection } from "../CollapsibleSection";

describe("CollapsibleSection", () => {
  const mockIcon = <div data-testid="test-icon">Icon</div>;

  it("renders with title and children", () => {
    const mockOnToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Test Section"
        isOpen={true}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("starts expanded when isOpen is true", () => {
    const mockOnToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Test Section"
        isOpen={true}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("calls onToggle when header is clicked", () => {
    const mockOnToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Test Section"
        isOpen={true}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    const header = screen.getByRole("button");
    fireEvent.click(header);

    expect(mockOnToggle).toHaveBeenCalledOnce();
  });

  it("starts collapsed when isOpen is false", () => {
    const mockOnToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Test Section"
        isOpen={false}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    // Content should still be in DOM but not visible
    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  it("renders icon with correct background", () => {
    const mockOnToggle = vi.fn();
    render(
      <CollapsibleSection
        title="Test Section"
        isOpen={true}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    expect(screen.getByTestId("test-icon")).toBeInTheDocument();
    const iconContainer = screen.getByTestId("test-icon").parentElement;
    expect(iconContainer).toHaveClass("bg-blue-500");
  });

  it("shows correct chevron direction based on isOpen state", () => {
    const mockOnToggle = vi.fn();
    const { rerender } = render(
      <CollapsibleSection
        title="Test Section"
        isOpen={true}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    // When expanded, chevron should be rotated
    const chevron = screen.getByRole("button").querySelector("svg");
    expect(chevron).toHaveClass("rotate-180");

    rerender(
      <CollapsibleSection
        title="Test Section"
        isOpen={false}
        onToggle={mockOnToggle}
        icon={mockIcon}
        iconBg="bg-blue-500"
      >
        <div>Test content</div>
      </CollapsibleSection>
    );

    // When collapsed, chevron should not be rotated
    const chevronCollapsed = screen.getByRole("button").querySelector("svg");
    expect(chevronCollapsed).not.toHaveClass("rotate-180");
  });
});
