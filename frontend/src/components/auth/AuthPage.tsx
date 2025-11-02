import { Button, Typography } from '@/components/ui';
import { buttonVariants } from '@/styles/design-tokens';
import { combineStyles } from '@/styles/tahoe-utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormContainer } from './AuthFormContainer';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  return (
    <div
      className={combineStyles('min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden')}
      data-testid="auth-page"
    >
      <div className="w-full max-w-md space-y-8 relative z-10">
        <div className="text-center">
          <AuthFormContainer className="mb-6">
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
              onClick={() => navigate('/')}
              className={combineStyles('mb-4', buttonVariants.outline)}
            >
              ← Back to App (Continue as Guest)
            </Button>
          </AuthFormContainer>
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
