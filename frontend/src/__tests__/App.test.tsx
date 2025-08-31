import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App";

// Mock the lazy-loaded Visualizer3D component
vi.mock("../components/Visualizer3D", () => ({
  default: vi.fn(() => <div data-testid="visualizer-3d">3D Visualizer</div>),
}));

// Mock the AuthProvider and useAuth hook
vi.mock("../providers", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: vi.fn(),
}));

// Mock the FormTabs component
vi.mock("../components/FormTabs", () => ({
  default: vi.fn(({ onResult, user, onLoadPreset, navigate }) => (
    <div data-testid="form-tabs">
      <button onClick={() => onResult([[1, 2, 3]], { test: "config" })}>
        Submit Form
      </button>
      <button onClick={() => onLoadPreset({ preset: "test" })}>
        Load Preset
      </button>
      <button onClick={() => navigate("/auth")}>Navigate to Auth</button>
      {user ? <span>User: {user.username}</span> : <span>No user</span>}
    </div>
  )),
}));

// Mock the AuthPage component
vi.mock("../components/auth/AuthPage", () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}));

// Mock the UI components
vi.mock("../components/ui", () => ({
  LoadingSpinner: ({ size, color, className }: any) => (
    <div data-testid="loading-spinner" className={className}>
      Loading Spinner ({size}, {color})
    </div>
  ),
  Typography: ({ variant, color, children, className }: any) => (
    <div data-testid={`typography-${variant}`} className={className}>
      {children}
    </div>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("App", () => {
  let mockUseAuth: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useAuth } = await import("../providers");
    mockUseAuth = vi.mocked(useAuth);
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  };

  describe("Loading States", () => {
    it("shows loading spinner when auth is loading", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        logout: vi.fn(),
      });

      renderApp();

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading Soft Robot App")).toBeInTheDocument();
      expect(
        screen.getByText("Checking authentication...")
      ).toBeInTheDocument();
    });

    it("shows loading spinner during app initialization", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading Soft Robot App")).toBeInTheDocument();
      expect(
        screen.getByText("Initializing components...")
      ).toBeInTheDocument();

      // Wait for initialization to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText("Initializing components...")
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Authentication UI", () => {
    it("shows sign in button when user is not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText("Sign In")).toBeInTheDocument();
      });
    });

    it("shows user info and logout button when user is authenticated", async () => {
      mockUseAuth.mockReturnValue({
        user: { username: "testuser" },
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText("testuser")).toBeInTheDocument();
        expect(screen.getByText("Logout")).toBeInTheDocument();
        expect(screen.queryByText("Sign In")).not.toBeInTheDocument();
      });
    });

    it("calls logout and navigates when logout button is clicked", async () => {
      const mockLogout = vi.fn();
      mockUseAuth.mockReturnValue({
        user: { username: "testuser" },
        isLoading: false,
        logout: mockLogout,
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText("Logout")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Logout"));

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates to auth page when sign in button is clicked", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText("Sign In")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText("Sign In"));

      expect(mockNavigate).toHaveBeenCalledWith("/auth");
    });
  });

  describe("Routing", () => {
    it("renders main app at root route", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId("form-tabs")).toBeInTheDocument();
        expect(screen.getByTestId("visualizer-3d")).toBeInTheDocument();
      });
    });
  });

  describe("Sidebar Functionality", () => {
    it("shows sidebar by default", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId("form-tabs")).toBeInTheDocument();
      });

      // Check that hide button is present
      expect(screen.getByLabelText("Hide parameters")).toBeInTheDocument();
    });
  });

  describe("Form Integration", () => {
    it("renders form tabs component", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId("form-tabs")).toBeInTheDocument();
      });
    });
  });

  describe("User Context", () => {
    it("renders app with user context", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId("form-tabs")).toBeInTheDocument();
      });
    });
  });

  describe("Visualizer3D Integration", () => {
    it("renders Visualizer3D component", async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId("visualizer-3d")).toBeInTheDocument();
      });
    });
  });

  describe("localStorage Integration", () => {
    it("tests localStorage functionality on mount", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      });

      renderApp();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          "=== App localStorage Test ==="
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          "Test value stored:",
          "app_test_value"
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          "Test value retrieved:",
          "app_test_value"
        );
        expect(consoleSpy).toHaveBeenCalledWith("localStorage working:", "YES");
      });

      consoleSpy.mockRestore();
    });
  });
});
