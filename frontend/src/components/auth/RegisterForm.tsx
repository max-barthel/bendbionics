import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedErrorHandler } from '../../features/shared/hooks/useUnifiedErrorHandler';
import { useAuth } from '../../providers';
import { Button, Input, Typography } from '../ui';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterFormHeader: React.FC = () => (
  <div className="text-center mb-6">
    <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
      Create Account
    </Typography>
    <Typography variant="body" color="gray" className="text-gray-600">
      Join the Soft Robot community
    </Typography>
  </div>
);

const RegisterFormError: React.FC<{
  error: { visible: boolean; message: string };
}> = ({ error }) => {
  if (!error.visible) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-md shadow-sm">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{error.message}</p>
        </div>
      </div>
    </div>
  );
};

const RegisterFormSuccess: React.FC<{
  success: string;
  onContinue: () => void;
}> = ({ success, onContinue }) => (
  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
    {success}
    <div className="mt-3">
      <Button variant="outline" onClick={onContinue} className="w-full">
        Continue to App
      </Button>
    </div>
  </div>
);

const RegisterFormFields: React.FC<{
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  setUsername: (value: string) => void;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
}> = ({
  username,
  email,
  password,
  confirmPassword,
  setUsername,
  setEmail,
  setPassword,
  setConfirmPassword,
}) => (
  <>
    <div>
      <label
        htmlFor="username"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Username *
      </label>
      <Input
        id="username"
        type="text"
        value={username}
        onChange={(value: string | number) => setUsername(String(value))}
        placeholder="Choose a username"
        className="w-full"
      />
    </div>

    <div>
      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
        Email *
      </label>
      <Input
        id="email"
        type="email"
        value={email}
        onChange={(value: string | number) => setEmail(String(value))}
        placeholder="your.email@example.com"
        className="w-full"
      />
    </div>

    <div>
      <label
        htmlFor="password"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Password *
      </label>
      <Input
        id="password"
        type="password"
        value={password}
        onChange={(value: string | number) => setPassword(String(value))}
        placeholder="Enter your password"
        className="w-full"
      />
      <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
    </div>

    <div>
      <label
        htmlFor="confirmPassword"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Confirm Password *
      </label>
      <Input
        id="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(value: string | number) => setConfirmPassword(String(value))}
        placeholder="Confirm your password"
        className="w-full"
      />
    </div>
  </>
);

const RegisterFormFooter: React.FC<{ onSwitchToLogin: () => void }> = ({
  onSwitchToLogin,
}) => (
  <div className="mt-6 text-center">
    <Typography variant="body" color="gray" className="text-gray-600">
      Already have an account?{' '}
      <button
        onClick={onSwitchToLogin}
        className="text-blue-600 hover:text-blue-500 font-medium transition-colors duration-200"
      >
        Sign in
      </button>
    </Typography>
  </div>
);

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // Use unified error handler
  const { error, showError, hideError, handleAuthError } = useUnifiedErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    hideError();
    setSuccess('');

    // Validate passwords match
    if (password !== confirmPassword) {
      showError('validation', 'Passwords do not match');
      return;
    }

    // Validate password strength
    const MIN_PASSWORD_LENGTH = 8;
    const MAX_PASSWORD_BYTES = 72; // bcrypt limit

    if (password.length < MIN_PASSWORD_LENGTH) {
      showError('validation', 'Password must be at least 8 characters long');
      return;
    }

    // Check for bcrypt 72-byte limit
    if (new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES) {
      showError(
        'validation',
        'Password is too long. Please use a password with 72 characters or less.'
      );
      return;
    }

    setIsLoading(true);

    try {
      await register({ username, email, password });
      setSuccess(
        'Registration successful! Check the terminal/server logs for your verification link (dev mode).'
      );
    } catch (err: unknown) {
      // Use unified error handler for consistent error handling
      handleAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
      <RegisterFormHeader />

      <form
        onSubmit={e => {
          e.preventDefault();
          void handleSubmit(e);
        }}
        className="space-y-4"
      >
        <RegisterFormError error={error} />

        {success && (
          <RegisterFormSuccess success={success} onContinue={() => navigate('/')} />
        )}

        <RegisterFormFields
          username={username}
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          setUsername={setUsername}
          setEmail={setEmail}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full backdrop-blur-xl border border-blue-400/30 shadow-lg transition-all duration-300 hover:scale-105 rounded-full bg-gradient-to-br from-blue-500/25 to-indigo-500/25 shadow-blue-500/20"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <RegisterFormFooter onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};
