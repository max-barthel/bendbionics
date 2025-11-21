import App from '@/App';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import type { MockedFunction } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Define the auth context type for testing
interface AuthContextType {
  user: { username: string } | null;
  isLoading: boolean;
  logout: () => void;
}

// Mock the Visualizer3D component
vi.mock('../features/visualization/components/Visualizer3D', () => ({
  default: vi.fn(() => <div data-testid="visualizer-3d">3D Visualizer</div>),
}));

// Define the app state context type for testing
interface AppStateContextType {
  user: { username: string } | null;
  isLoading: boolean;
  logout: () => void;
  navigate: (path: string) => void | Promise<void>;
  segments: number[][][];
  setSegments: (segments: number[][][]) => void;
  currentConfiguration: Record<string, unknown>;
  setCurrentConfiguration: (config: Record<string, unknown>) => void;
  setRobotState: (state: unknown) => void;
  isInitializing: boolean;
  setIsInitializing: (initializing: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  showPresetManager: boolean;
  setShowPresetManager: (show: boolean) => void;
  showTendonResults: boolean;
  setShowTendonResults: (show: boolean) => void;
  showUserSettings: boolean;
  setShowUserSettings: (show: boolean) => void;
  showAboutModal: boolean;
  setShowAboutModal: (show: boolean) => void;
  isLoadingPreset: boolean;
  setIsLoadingPreset: (loading: boolean) => void;
  presetLoadKey: number;
  setPresetLoadKey: (fn: (prev: number) => number) => void;
  handleFormResult: () => void;
  handleLoadPreset: () => void;
  handleShowPresetManager: () => void;
  toggleSidebar: () => void;
}

// Mock the AuthProvider and useAuth hook
const mockUseAppState = vi.fn(
  (): AppStateContextType => ({
    user: null,
    isLoading: false,
    logout: vi.fn(),
    navigate: vi.fn(),
    segments: [],
    setSegments: vi.fn(),
    currentConfiguration: {},
    setCurrentConfiguration: vi.fn(),
    setRobotState: vi.fn(),
    isInitializing: false,
    setIsInitializing: vi.fn(),
    loading: false,
    setLoading: vi.fn(),
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(),
    showPresetManager: false,
    setShowPresetManager: vi.fn(),
    showTendonResults: true,
    setShowTendonResults: vi.fn(),
    showUserSettings: false,
    setShowUserSettings: vi.fn(),
    showAboutModal: false,
    setShowAboutModal: vi.fn(),
    isLoadingPreset: false,
    setIsLoadingPreset: vi.fn(),
    presetLoadKey: 0,
    setPresetLoadKey: vi.fn(),
    handleFormResult: vi.fn(),
    handleLoadPreset: vi.fn(),
    handleShowPresetManager: vi.fn(),
    toggleSidebar: vi.fn(),
  })
);

vi.mock('../providers', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AppStateProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: vi.fn(),
  useAppState: () => mockUseAppState(),
}));

// Mock the FormTabs component
vi.mock('../features/robot-config/components/FormTabs', () => ({
  default: vi.fn(({ onResult, onLoadPreset }) => (
    <div data-testid="form-tabs">
      <button onClick={() => onResult([[1, 2, 3]], { test: 'config' })}>
        Submit Form
      </button>
      <button onClick={() => onLoadPreset({ preset: 'test' })}>Load Preset</button>
    </div>
  )),
}));

// Mock the AuthPage component
vi.mock('../components/auth/AuthPage', () => ({
  AuthPage: () => <div data-testid="auth-page">Auth Page</div>,
}));

// Mock EmailVerification component
vi.mock('../components/auth/EmailVerification', () => ({
  EmailVerification: () => (
    <div data-testid="email-verification">Email Verification</div>
  ),
}));

// Mock the UI components
vi.mock('../components/ui', () => ({
  LoadingSpinner: ({
    size,
    color,
    className,
  }: {
    size?: string;
    color?: string;
    className?: string;
  }) => (
    <div data-testid="loading-spinner" className={className}>
      Loading Spinner ({size}, {color})
    </div>
  ),
  Typography: ({
    variant,
    children,
    className,
  }: {
    variant?: string;
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid={`typography-${variant}`} className={className}>
      {children}
    </div>
  ),
  TypographyH4: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="typography-h4" className={className}>
      {children}
    </div>
  ),
  TypographyBody: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="typography-body" className={className}>
      {children}
    </div>
  ),
  Modal: ({
    isOpen,
    children,
    onClose,
  }: {
    isOpen: boolean;
    children?: React.ReactNode;
    onClose?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="modal">
        {children}
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close modal"
            data-testid="modal-close-button"
          >
            ×
          </button>
        )}
      </div>
    ) : null,
  Button: ({
    children,
    onClick,
    disabled,
    className,
    ...props
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
  Alert: ({
    children,
    variant,
    className,
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <div data-testid={`alert-${variant}`} className={className}>
      {children}
    </div>
  ),
  Badge: ({
    children,
    variant,
    className,
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <span data-testid={`badge-${variant}`} className={className}>
      {children}
    </span>
  ),
  Card: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
  Input: ({
    placeholder,
    value,
    onChange,
    className,
  }: {
    placeholder?: string;
    value?: string;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    className?: string;
  }) => (
    <input
      data-testid="input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  ),
  LoadingOverlay: ({
    children,
    isLoading,
    className,
  }: {
    children?: React.ReactNode;
    isLoading?: boolean;
    className?: string;
  }) => (
    <div data-testid="loading-overlay" className={className}>
      {isLoading ? 'Loading...' : children}
    </div>
  ),
  Notification: ({
    children,
    variant,
    className,
  }: {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }) => (
    <div data-testid={`notification-${variant}`} className={className}>
      {children}
    </div>
  ),
  NumberInput: ({
    value,
    onChange,
    className,
  }: {
    value?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    className?: string;
  }) => (
    <input
      data-testid="number-input"
      type="number"
      value={value}
      onChange={onChange}
      className={className}
      aria-label="Number input"
    />
  ),
  ProgressIndicator: ({
    value,
    max,
    className,
  }: {
    value?: string | number;
    max?: string | number;
    className?: string;
  }) => (
    <div data-testid="progress-indicator" className={className}>
      Progress: {value}/{max}
    </div>
  ),
  SkeletonLoader: ({ className }: { className?: string }) => (
    <div data-testid="skeleton-loader" className={className}>
      Loading...
    </div>
  ),
  SliderInput: ({
    value,
    onChange,
    className,
  }: {
    value?: string | number;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    className?: string;
  }) => (
    <input
      data-testid="slider-input"
      type="range"
      value={value}
      onChange={onChange}
      className={className}
      aria-label="Slider input"
    />
  ),
  Table: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <table data-testid="table" className={className}>
      {children}
    </table>
  ),
  TableBody: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <tbody data-testid="table-body" className={className}>
      {children}
    </tbody>
  ),
  TableCell: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <td data-testid="table-cell" className={className}>
      {children}
    </td>
  ),
  TableHead: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <thead data-testid="table-head" className={className}>
      {children}
    </thead>
  ),
  TableHeader: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <th data-testid="table-header" className={className}>
      {children}
    </th>
  ),
  TableRow: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <tr data-testid="table-row" className={className}>
      {children}
    </tr>
  ),
  TabPanel: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tab-panel" className={className}>
      {children}
    </div>
  ),
  Tabs: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tabs" className={className}>
      {children}
    </div>
  ),
  SubsectionTitle: ({
    title,
    description,
    className,
  }: {
    title?: string;
    description?: string;
    className?: string;
  }) => (
    <div data-testid="subsection-title" className={className}>
      <h5>{title}</h5>
      {description && <span>{description}</span>}
    </div>
  ),
  TendonConfigPanel: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="tendon-config-panel" className={className}>
      {children}
    </div>
  ),
  CollapsibleSection: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="collapsible-section" className={className}>
      {children}
    </div>
  ),
  AngleControlPanel: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="angle-control-panel" className={className}>
      {children}
    </div>
  ),
  UploadIcon: ({ className }: { className?: string }) => (
    <div data-testid="upload-icon" className={className}>
      Upload Icon
    </div>
  ),
  UnitSelector: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="unit-selector" className={className}>
      {children}
    </div>
  ),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('App', () => {
  let mockUseAuth: MockedFunction<() => AuthContextType>;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { useAuth } = await import('../providers');
    mockUseAuth = vi.mocked(useAuth);
    // Reset useAppState mock to default
    mockUseAppState.mockReturnValue({
      user: null,
      isLoading: false,
      logout: vi.fn(),
      navigate: vi.fn(),
      segments: [],
      setSegments: vi.fn(),
      currentConfiguration: {},
      setCurrentConfiguration: vi.fn(),
      setRobotState: vi.fn(),
      isInitializing: false,
      setIsInitializing: vi.fn(),
      loading: false,
      setLoading: vi.fn(),
      sidebarCollapsed: false,
      setSidebarCollapsed: vi.fn(),
      showPresetManager: false,
      setShowPresetManager: vi.fn(),
      showTendonResults: true,
      setShowTendonResults: vi.fn(),
      showUserSettings: false,
      setShowUserSettings: vi.fn(),
      showAboutModal: false,
      setShowAboutModal: vi.fn(),
      isLoadingPreset: false,
      setIsLoadingPreset: vi.fn(),
      presetLoadKey: 0,
      setPresetLoadKey: vi.fn(),
      handleFormResult: vi.fn(),
      handleLoadPreset: vi.fn(),
      handleShowPresetManager: vi.fn(),
      toggleSidebar: vi.fn(),
    });
  });

  const renderApp = () => {
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
  };

  // Helper to make dropdown visible (CSS hover doesn't work in jsdom)
  const showDropdown = (container: HTMLElement) => {
    const dropdown = container.querySelector(
      '[class*="opacity-0"][class*="invisible"]'
    ) as HTMLElement;
    if (dropdown) {
      dropdown.classList.remove('opacity-0', 'invisible');
      dropdown.classList.add('opacity-100', 'visible');
    }
  };

  // Helper to find button by text content or predicate
  const findButtonByText = (
    container: HTMLElement,
    textOrPredicate: string | ((btn: HTMLButtonElement) => boolean)
  ): HTMLButtonElement | undefined => {
    const predicate =
      typeof textOrPredicate === 'string'
        ? (btn: HTMLButtonElement) => btn.textContent?.includes(textOrPredicate)
        : textOrPredicate;
    return Array.from(container.querySelectorAll('button')).find(predicate);
  };

  describe('Loading States', () => {
    it('shows loading spinner when auth is loading', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        logout: vi.fn(),
      } as AuthContextType);

      // Mock useAppState to return isLoading: true
      mockUseAppState.mockReturnValue({
        user: null,
        isLoading: true,
        logout: vi.fn(),
        navigate: vi.fn(),
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: false,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      renderApp();

      // LoadingScreen component renders LoadingSpinner and text
      expect(screen.getByText('Loading BendBionics App')).toBeInTheDocument();
      expect(screen.getByText('Checking authentication...')).toBeInTheDocument();
    });

    it('shows loading spinner during app initialization', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      // Mock isInitializing to be true initially
      mockUseAppState.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
        navigate: vi.fn(),
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: true,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      const { rerender } = renderApp();

      // When initializing, should show LoadingScreen
      expect(screen.getByText('Loading BendBionics App')).toBeInTheDocument();
      expect(screen.getByText('Initializing components...')).toBeInTheDocument();

      // Simulate initialization completing
      mockUseAppState.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
        navigate: vi.fn(),
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: false,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      // Re-render the component with the updated mock state
      rerender(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Wait for initialization to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('Initializing components...')
          ).not.toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('Authentication UI', () => {
    it('shows sign in button when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });
    });

    it('shows user info and logout button when user is authenticated', async () => {
      mockUseAuth.mockReturnValue({
        user: { username: 'testuser' },
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      mockUseAppState.mockReturnValue({
        user: { username: 'testuser' },
        isLoading: false,
        logout: vi.fn(),
        navigate: vi.fn(),
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: false,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      const { container } = renderApp();

      // Wait for the menu button to be rendered
      await waitFor(() => {
        expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      });

      // Manually make dropdown visible (CSS hover doesn't work in jsdom)
      showDropdown(container);

      await waitFor(() => {
        // Query for text in the dropdown (even if hidden)
        const allText = container.textContent || '';
        expect(allText).toContain('testuser');
        expect(allText).toContain('Sign Out');
        expect(allText).not.toContain('Sign In');
      });
    });

    it('calls logout and navigates when logout button is clicked', async () => {
      const mockLogout = vi.fn();
      const mockNavigateFn = vi.fn();
      mockUseAuth.mockReturnValue({
        user: { username: 'testuser' },
        isLoading: false,
        logout: mockLogout,
      } as AuthContextType);

      mockUseAppState.mockReturnValue({
        user: { username: 'testuser' },
        isLoading: false,
        logout: mockLogout,
        navigate: mockNavigateFn,
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: false,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      const { container } = renderApp();

      // Wait for the menu button to be rendered
      await waitFor(() => {
        expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      });

      // Manually make dropdown visible (CSS hover doesn't work in jsdom)
      showDropdown(container);

      await waitFor(() => {
        // Find Sign Out button even if hidden
        const signOutButton = findButtonByText(container, 'Sign Out');
        expect(signOutButton).toBeTruthy();
      });

      const signOutButton = findButtonByText(container, 'Sign Out');
      if (signOutButton) {
        fireEvent.click(signOutButton);
      }

      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigateFn).toHaveBeenCalledWith('/');
    });

    it('navigates to auth page when sign in button is clicked', async () => {
      const mockNavigateFn = vi.fn();
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      mockUseAppState.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
        navigate: mockNavigateFn,
        segments: [],
        setSegments: vi.fn(),
        currentConfiguration: {},
        setCurrentConfiguration: vi.fn(),
        setRobotState: vi.fn(),
        isInitializing: false,
        setIsInitializing: vi.fn(),
        loading: false,
        setLoading: vi.fn(),
        sidebarCollapsed: false,
        setSidebarCollapsed: vi.fn(),
        showPresetManager: false,
        setShowPresetManager: vi.fn(),
        showTendonResults: true,
        setShowTendonResults: vi.fn(),
        showUserSettings: false,
        setShowUserSettings: vi.fn(),
        showAboutModal: false,
        setShowAboutModal: vi.fn(),
        isLoadingPreset: false,
        setIsLoadingPreset: vi.fn(),
        presetLoadKey: 0,
        setPresetLoadKey: vi.fn(),
        handleFormResult: vi.fn(),
        handleLoadPreset: vi.fn(),
        handleShowPresetManager: vi.fn(),
        toggleSidebar: vi.fn(),
      });

      const { container } = renderApp();

      // Wait for the menu button to be rendered
      await waitFor(() => {
        expect(screen.getAllByTestId('button').length).toBeGreaterThan(0);
      });

      // Manually make dropdown visible (CSS hover doesn't work in jsdom)
      showDropdown(container);

      const findSignInButton = (btn: HTMLButtonElement) =>
        btn.textContent?.includes('Sign In') && !btn.textContent?.includes('Sign Out');

      await waitFor(() => {
        // Find Sign In button even if hidden
        const signInButton = findButtonByText(container, findSignInButton);
        expect(signInButton).toBeTruthy();
      });

      const signInButton = findButtonByText(container, findSignInButton);
      if (signInButton) {
        fireEvent.click(signInButton);
      }

      expect(mockNavigateFn).toHaveBeenCalledWith('/auth');
    });
  });

  describe('Routing', () => {
    it('renders main app at root route', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('form-tabs')).toBeInTheDocument();
        expect(screen.getByTestId('visualizer-3d')).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar Functionality', () => {
    it('shows sidebar by default', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('form-tabs')).toBeInTheDocument();
      });

      // Check that hide button is present
      expect(screen.getByLabelText('Hide parameters')).toBeInTheDocument();
    });
  });

  describe('Form Integration', () => {
    it('renders form tabs component', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('form-tabs')).toBeInTheDocument();
      });
    });
  });

  describe('User Context', () => {
    it('renders app with user context', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('form-tabs')).toBeInTheDocument();
      });
    });
  });

  describe('Visualizer3D Integration', () => {
    it('renders Visualizer3D component', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      await waitFor(() => {
        expect(screen.getByTestId('visualizer-3d')).toBeInTheDocument();
      });
    });
  });

  describe('localStorage Integration', () => {
    it('tests localStorage functionality on mount', async () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        logout: vi.fn(),
      } as AuthContextType);

      renderApp();

      // The App component should render without errors
      await waitFor(() => {
        expect(screen.getByTestId('visualizer-3d')).toBeInTheDocument();
      });

      // Verify localStorage is accessible (basic functionality test)
      expect(() => {
        localStorage.setItem('test', 'value');
        expect(localStorage.getItem('test')).toBe('value');
        localStorage.removeItem('test');
      }).not.toThrow();
    });
  });
});
