import { Button, FormField, FormMessage, PrimaryButton } from '@/components/ui';
import { useAsyncOperation, useUnifiedErrorHandler } from '@/features/shared';
import { useAuth } from '@/providers';
import { validatePassword, validatePasswordMatch } from '@/utils/passwordValidation';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthFormContainer } from './AuthFormContainer';
import { AuthFormFooter } from './AuthFormFooter';
import { AuthFormHeader } from './AuthFormHeader';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

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

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');

  // Use unified error handler for validation errors (shown before async operation)
  const { showError } = useUnifiedErrorHandler();

  // Use async operation hook for the actual registration
  const { isLoading, error, execute } = useAsyncOperation<{ message: string }>({
    onSuccess: result => {
      // Use the message from the backend (environment-aware)
      setSuccess(result.message);
    },
    onStart: () => {
      setSuccess('');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    const matchValidation = validatePasswordMatch(password, confirmPassword);
    if (!matchValidation.isValid && matchValidation.error) {
      showError('validation', matchValidation.error);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid && passwordValidation.error) {
      showError('validation', passwordValidation.error);
      return;
    }

    await execute(async () => {
      return await register({ username, email, password });
    });
  };

  return (
    <AuthFormContainer>
      <AuthFormHeader
        title="Create Account"
        description="Join the BendBionics community"
      />

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

      <AuthFormFooter
        promptText="Already have an account?"
        switchText="Sign in"
        onSwitch={onSwitchToLogin}
      />
    </AuthFormContainer>
  );
};
