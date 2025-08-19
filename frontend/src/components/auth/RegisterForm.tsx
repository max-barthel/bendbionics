import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../providers";
import { Button, Card, Input, Typography } from "../ui";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
}) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password });
      setSuccess(
        "Registration successful! Please check your email to verify your account."
      );
    } catch (err: any) {
      // Handle different types of registration errors
      if (err.response?.status === 400) {
        setError(
          err.response?.data?.detail ||
            "Registration failed. Please check your information and try again."
        );
      } else if (err.response?.status === 409) {
        setError(
          "An account with this email already exists. Please try logging in instead."
        );
      } else if (err.response?.status === 0 || !err.response) {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(
          err.response?.data?.detail || "Registration failed. Please try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <Typography variant="h2" color="primary" className="mb-2">
          Create Account
        </Typography>
        <Typography variant="body" color="gray">
          Join the Soft Robot community
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
            <div className="mt-3">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="w-full"
              >
                Continue to App
              </Button>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(value) => setEmail(String(value))}
            placeholder="Enter your email"
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
            onChange={(value) => setPassword(String(value))}
            placeholder="Enter your password"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(value) => setConfirmPassword(String(value))}
            placeholder="Confirm your password"
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Typography variant="body" color="gray">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in
          </button>
        </Typography>
      </div>
    </Card>
  );
};
