import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Typography } from '../ui';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      data-testid="auth-page"
    >
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
            <Typography variant="h1" color="primary" className="mb-2 text-gray-800">
              BendBionics
            </Typography>
            <Typography variant="body" color="gray" className="mb-12 text-gray-600">
              {isLogin
                ? 'Sign in to save and load your presets'
                : 'Create an account to save your configurations'}
            </Typography>

            {/* Extra spacing */}
            <div className="h-6"></div>

            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="mb-4 border border-gray-300 shadow-sm transition-all duration-300 hover:scale-105 rounded-full bg-white hover:bg-gray-50"
            >
              ← Back to App (Continue as Guest)
            </Button>
          </div>
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
