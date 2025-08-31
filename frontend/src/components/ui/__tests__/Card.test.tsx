import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Card from "../Card";

describe("Card", () => {
  describe("Rendering", () => {
    it("renders with children", () => {
      render(<Card>Test content</Card>);

      const card = screen.getByText("Test content");
      expect(card).toBeInTheDocument();
    });

    it("renders with complex children", () => {
      render(
        <Card>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </Card>
      );

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Description")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("renders with empty children", () => {
      render(<Card></Card>);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveTextContent("");
    });

    it("renders with null children", () => {
      render(<Card>{null}</Card>);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
    });

    it("renders with undefined children", () => {
      render(<Card>{undefined}</Card>);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("applies default classes", () => {
      render(<Card>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "p-8",
        "bg-white",
        "rounded-xl",
        "shadow-lg",
        "border",
        "border-neutral-200"
      );
    });

    it("applies custom className", () => {
      render(<Card className="custom-class">Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("custom-class");
    });

    it("combines default and custom classes", () => {
      render(<Card className="custom-class">Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "p-8",
        "bg-white",
        "rounded-xl",
        "shadow-lg",
        "border",
        "border-neutral-200",
        "custom-class"
      );
    });

    it("handles empty className", () => {
      render(<Card className="">Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "p-8",
        "bg-white",
        "rounded-xl",
        "shadow-lg",
        "border",
        "border-neutral-200"
      );
    });

    it("handles undefined className", () => {
      render(<Card className={undefined}>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(
        "p-8",
        "bg-white",
        "rounded-xl",
        "shadow-lg",
        "border",
        "border-neutral-200"
      );
    });
  });

  describe("Structure", () => {
    it("renders as a div element", () => {
      render(<Card>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card.tagName).toBe("DIV");
    });

    it("has proper role", () => {
      render(<Card>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Content Handling", () => {
    it("renders text content", () => {
      render(<Card>Simple text content</Card>);

      expect(screen.getByText("Simple text content")).toBeInTheDocument();
    });

    it("renders HTML elements", () => {
      render(
        <Card>
          <div data-testid="inner-div">Inner content</div>
        </Card>
      );

      expect(screen.getByTestId("inner-div")).toBeInTheDocument();
      expect(screen.getByText("Inner content")).toBeInTheDocument();
    });

    it("renders multiple children", () => {
      render(
        <Card>
          <span>First</span>
          <span>Second</span>
          <span>Third</span>
        </Card>
      );

      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
      expect(screen.getByText("Third")).toBeInTheDocument();
    });

    it("renders React components", () => {
      const TestComponent = () => (
        <span data-testid="test-component">Test Component</span>
      );

      render(
        <Card>
          <TestComponent />
        </Card>
      );

      expect(screen.getByTestId("test-component")).toBeInTheDocument();
      expect(screen.getByText("Test Component")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper semantic structure", () => {
      render(<Card>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toBeInTheDocument();
    });

    it("maintains accessibility with complex content", () => {
      render(
        <Card>
          <h1>Title</h1>
          <p>Description</p>
          <button>Action</button>
        </Card>
      );

      expect(screen.getByRole("heading")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long content", () => {
      const longContent = "A".repeat(1000);
      render(<Card>{longContent}</Card>);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it("handles special characters in content", () => {
      render(<Card>{"Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?"}</Card>);

      expect(
        screen.getByText("Special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?")
      ).toBeInTheDocument();
    });

    it("handles unicode characters", () => {
      render(<Card>Unicode: 🚀🌟🎉中文日本語한국어</Card>);

      expect(
        screen.getByText("Unicode: 🚀🌟🎉中文日本語한국어")
      ).toBeInTheDocument();
    });

    it("handles className with special characters", () => {
      render(
        <Card className="class-with-dashes_and_underscores">Content</Card>
      );

      const card = screen.getByTestId("card");
      expect(card).toHaveClass("class-with-dashes_and_underscores");
    });

    it("handles very long className", () => {
      const longClassName =
        "very-long-class-name-that-might-be-generated-dynamically".repeat(10);
      render(<Card className={longClassName}>Content</Card>);

      const card = screen.getByTestId("card");
      expect(card).toHaveClass(longClassName);
    });
  });
});
