import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Typography } from "../ui";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Typography variant="h1" color="primary" className="mb-2">
            Soft Robot App
          </Typography>
          <Typography variant="body" color="gray" className="mb-4">
            {isLogin
              ? "Sign in to save and load your presets"
              : "Create an account to save your configurations"}
          </Typography>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            ← Back to App (Continue as Guest)
          </Button>
        </div>

        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};
