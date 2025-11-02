import { FormField, FormMessage, PrimaryButton } from '@/components/ui';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { useAuth } from '@/providers';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormContainer } from './AuthFormContainer';
import { AuthFormFooter } from './AuthFormFooter';
import { AuthFormHeader } from './AuthFormHeader';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

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
    <AuthFormContainer>
      <AuthFormHeader title="Welcome Back" description="Sign in to your account" />

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

        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </PrimaryButton>
      </form>

      <AuthFormFooter
        promptText="Don't have an account?"
        switchText="Sign up"
        onSwitch={onSwitchToRegister}
      />
    </AuthFormContainer>
  );
};
