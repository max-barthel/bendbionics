import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUnifiedErrorHandler } from '@/features/shared/hooks/useUnifiedErrorHandler';
import { useAuth } from '@/providers';
import { Button, FormField, FormMessage, PrimaryButton, Typography } from '@/components/ui';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterFormHeader: React.FC = () => (
  <div className="text-center mb-6">
    <Typography variant="h2" color="primary" className="mb-2 text-gray-800">
      Create Account
    </Typography>
    <Typography variant="body" color="gray" className="text-gray-600">
      Join the BendBionics community
    </Typography>
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
    <FormField
      id="username"
      label="Username"
      type="text"
      value={username}
      onChange={(value: string | number) => setUsername(String(value))}
      placeholder="Choose a username"
      required
    />

    <FormField
      id="email"
      label="Email"
      type="email"
      value={email}
      onChange={(value: string | number) => setEmail(String(value))}
      placeholder="your.email@example.com"
      required
    />

    <FormField
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={(value: string | number) => setPassword(String(value))}
      placeholder="Enter your password"
      required
      helperText="Must be at least 8 characters long"
    />

    <FormField
      id="confirmPassword"
      label="Confirm Password"
      type="password"
      value={confirmPassword}
      onChange={(value: string | number) => setConfirmPassword(String(value))}
      placeholder="Confirm your password"
      required
    />
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
      const response = await register({ username, email, password });
      // Use the message from the backend (environment-aware)
      setSuccess(response.message);
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
        {error.visible && (
          <FormMessage message={error.message} type="error" variant="standard" />
        )}

        {success && (
          <FormMessage message={success} type="success" variant="standard">
            <div className="mt-3">
              <Button onClick={() => navigate('/')} className="w-full">
                Continue to App
              </Button>
            </div>
          </FormMessage>
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

        <PrimaryButton type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </PrimaryButton>
      </form>

      <RegisterFormFooter onSwitchToLogin={onSwitchToLogin} />
    </div>
  );
};
