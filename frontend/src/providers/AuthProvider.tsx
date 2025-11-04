import { authAPI } from '@/api/auth';
import type {
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
  User,
} from '@/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<RegisterResponse>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  // Ensure we always provide a valid context, even if there are errors

  // Check if user is authenticated on mount
  useEffect(() => {
    if (hasCheckedAuth.current) {
      return;
    }

    const checkAuth = async () => {
      try {
        hasCheckedAuth.current = true;
        if (token) {
          try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
          } catch (error) {
            // Only clear token if it's a genuine authentication error
            // Don't clear on network issues or temporary server problems
            if (error && typeof error === 'object' && 'response' in error) {
              const response = (error as { response?: { status?: number } }).response;
              if (response?.status === 401) {
                console.warn(
                  'Token appears invalid during initial check - clearing authentication'
                );
                localStorage.removeItem('token');
                setToken(null);
              }
            }
            // For other errors (network, server issues), keep the user logged in
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Don't clear everything on any error - just log it
        // This prevents clearing tokens on network issues or temporary problems
        console.warn('Auth check failed but keeping user logged in');
      } finally {
        setIsLoading(false);
      }
    };

    // Add a timeout to ensure we always set loading to false
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        // Auth check timeout, setting loading to false
        setIsLoading(false);
      }
    }, 5000);

    void checkAuth();

    return () => clearTimeout(timeoutId);
  }, [token, isLoading]);

  const login = useCallback(async (data: LoginRequest) => {
    try {
      const response = await authAPI.login(data);
      const { access_token, user: userData } = response;

      // Clean the token before storing - remove any quotes
      const cleanToken = access_token.replaceAll('"', '');

      // Store token in localStorage
      localStorage.setItem('token', cleanToken);

      // Also store in global window object for Tauri compatibility
      if (typeof globalThis !== 'undefined') {
        (globalThis as unknown as Window & { authToken?: string }).authToken =
          cleanToken;
      }

      setToken(cleanToken);
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  }, []);

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        const response = await authAPI.register(data);
        setUser(response.user);
        // Auto-login after registration for local users
        if ('is_local' in response.user && response.user.is_local) {
          const loginData = {
            username: data.username,
            password: data.password,
          };
          await login(loginData);
        }
        return response; // Return the full response including message
      } catch (error) {
        console.error('Registration failed:', error);
        throw error; // Re-throw so the calling component can handle it
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    if (typeof globalThis !== 'undefined') {
      delete (globalThis as unknown as Window & { authToken?: string }).authToken;
    }
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileRequest) => {
    try {
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile failed:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      if (token) {
        console.log('Refreshing user data...');
        const userData = await authAPI.getCurrentUser();
        console.log('User data refreshed successfully:', userData);
        setUser(userData);
      } else {
        console.log('No token available for refresh');
      }
    } catch (error) {
      console.error('Refresh user failed:', error);

      // Don't clear token on any error - let the user stay logged in
      // The token might still be valid, just the refresh failed
      console.warn('Refresh failed but keeping user logged in');
    }
  }, [token]);

  const deleteAccount = useCallback(async () => {
    try {
      await authAPI.deleteAccount();
      // Clear all authentication data after successful deletion
      logout();
    } catch (error) {
      console.error('Delete account failed:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  }, [logout]);

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isLoading,
      login,
      register,
      updateProfile,
      refreshUser,
      logout,
      deleteAccount,
    }),
    [
      user,
      isLoading,
      login,
      register,
      updateProfile,
      refreshUser,
      logout,
      deleteAccount,
    ]
  );

  // Always provide the context, even if there are errors
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
