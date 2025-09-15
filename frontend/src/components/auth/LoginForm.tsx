import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers";
import { Button, Input, Typography } from "../ui";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ username, password });
      // Redirect to main app after successful login
      navigate("/");
    } catch (err: any) {
      // Show error in desktop app

      // Handle different types of authentication errors
      if (err.response?.status === 401) {
        setError(
          "Invalid username or password. Please check your credentials and try again."
        );
      } else if (err.response?.status === 400) {
        setError(
          err.response?.data?.detail ||
            "Account is not active. Please check your email for verification."
        );
      } else if (err.response?.status === 0 || !err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          err.response?.data?.detail || "Login failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <div className="text-center mb-6">
        <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
          Welcome Back
        </Typography>
        <Typography variant="body" color="gray" className="text-gray-600">
          Sign in to your account
        </Typography>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Username
          </label>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(value: string | number) => setUsername(String(value))}
            placeholder="Enter your username"
            className="w-full"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(value: string | number) => setPassword(String(value))}
            placeholder="Enter your password"
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full"
          disabled={isLoading}
          style={{
            background:
              "linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.25) 100%)",
            boxShadow:
              "0 4px 16px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Typography variant="body" color="gray" className="text-gray-600">
          Don't have an account?{" "}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
          >
            Sign up
          </button>
        </Typography>
      </div>
    </div>
  );
};
