import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { useAuth } from '@/providers';
import { FormField, FormMessage, PrimaryButton, Typography } from '@/components/ui';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginFormHeader: React.FC = () => (
  <div className="text-center mb-6">
    <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
      Welcome Back
    </Typography>
    <Typography variant="body" color="gray" className="text-gray-600">
      Sign in to your account
    </Typography>
  </div>
);


const LoginFormFields: React.FC<{
  username: string;
  password: string;
  setUsername: (value: string) => void;
  setPassword: (value: string) => void;
}> = ({ username, password, setUsername, setPassword }) => (
  <>
    <FormField
      id="username"
      label="Username"
      type="text"
      value={username}
      onChange={(value: string | number) => setUsername(String(value))}
      placeholder="Enter your username"
    />

    <FormField
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={(value: string | number) => setPassword(String(value))}
      placeholder="Enter your password"
    />
  </>
);

const LoginFormFooter: React.FC<{
  onSwitchToRegister: () => void;
}> = ({ onSwitchToRegister }) => (
  <div className="mt-6 text-center">
    <Typography variant="body" color="gray" className="text-gray-600">
      Don't have an account?{' '}
      <button
        onClick={onSwitchToRegister}
        className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
      >
        Sign up
      </button>
    </Typography>
  </div>
);

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Use unified error handler
  const { error, hideError, handleAuthError } = useUnifiedErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideError();
    setIsLoading(true);

    try {
      await login({ username, password });
      // Redirect to main app after successful login
      navigate('/');
    } catch (err: unknown) {
      // Use unified error handler for consistent error handling
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <LoginFormHeader />

      <form
        onSubmit={e => {
          e.preventDefault();
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        {error.visible && (
          <FormMessage message={error.message} type="error" variant="standard" />
        )}
        <LoginFormFields
          username={username}
          password={password}
          setUsername={setUsername}
          setPassword={setPassword}
        />

        <PrimaryButton
          type="submit"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </PrimaryButton>
      </form>

      <LoginFormFooter onSwitchToRegister={onSwitchToRegister} />
    </div>
  );
};
