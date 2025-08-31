import { createContext, useContext, useEffect, useState } from "react";
import type { LoginRequest, RegisterRequest, User } from "../api/auth";
import { authAPI } from "../api/auth";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (data: LoginRequest) => {
    try {
      const response = await authAPI.login(data);
      const { access_token, user: userData } = response;

      console.log(
        "Login successful, storing token:",
        access_token ? `"${access_token.substring(0, 20)}..."` : "null"
      );
      // Clean the token before storing - remove any quotes
      const cleanToken = access_token.replace(/^"|"$/g, "");

      // Store token in multiple places for Tauri compatibility
      localStorage.setItem("token", cleanToken);
      sessionStorage.setItem("token", cleanToken);

      // Also store in global window object for Tauri
      if (typeof window !== "undefined") {
        (window as any).authToken = cleanToken;
      }

      // Debug: Verify token storage
      console.log("=== Login Token Storage Debug ===");
      console.log(
        "localStorage token stored:",
        localStorage.getItem("token") ? "YES" : "NO"
      );
      console.log(
        "sessionStorage token stored:",
        sessionStorage.getItem("token") ? "YES" : "NO"
      );
      console.log(
        "window.authToken stored:",
        (window as any).authToken ? "YES" : "NO"
      );
      console.log("================================");

      setToken(access_token);
      setUser(userData);

      // Verify token was stored
      const storedToken = localStorage.getItem("token");
      console.log(
        "Token stored in localStorage:",
        storedToken ? `"${storedToken.substring(0, 20)}..."` : "null"
      );

      // Force a small delay to ensure localStorage is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify again after delay
      const storedTokenAfterDelay = localStorage.getItem("token");
      console.log(
        "Token in localStorage after delay:",
        storedTokenAfterDelay
          ? `"${storedTokenAfterDelay.substring(0, 20)}..."`
          : "null"
      );

      // Force a longer delay to ensure localStorage is fully updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Final verification
      const finalToken = localStorage.getItem("token");
      console.log(
        "Final token in localStorage:",
        finalToken ? `"${finalToken.substring(0, 20)}..."` : "null"
      );

      // Test auth immediately after login
      try {
        const testUser = await authAPI.getCurrentUser();
        console.log("Auth test after login successful:", testUser.username);
      } catch (authError) {
        console.error("Auth test after login failed:", authError);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      const userData = await authAPI.register(data);
      setUser(userData);
      // Auto-login after registration for local users
      if (userData.is_local) {
        const loginData = { username: data.username, password: data.password };
        await login(loginData);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
