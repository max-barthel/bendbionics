import { Button, FormField, FormMessage } from '@/components/ui';
import { useAuthForm } from '@/features/auth';
import { useFormFields, useUnifiedErrorHandler } from '@/features/shared';
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
  setUsername: (value: string | number) => void;
  setEmail: (value: string | number) => void;
  setPassword: (value: string | number) => void;
  setConfirmPassword: (value: string | number) => void;
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
      onChange={setUsername}
      placeholder="Choose a username"
      required
    />

    <FormField
      id="email"
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      placeholder="your.email@example.com"
      required
    />

    <FormField
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={setPassword}
      placeholder="Enter your password"
      required
      helperText="Must be at least 8 characters long"
    />

    <FormField
      id="confirmPassword"
      label="Confirm Password"
      type="password"
      value={confirmPassword}
      onChange={setConfirmPassword}
      placeholder="Confirm your password"
      required
    />
  </>
);

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [success, setSuccess] = useState('');

  // Manage form fields with useFormFields hook
  const fields = useFormFields([
    { name: 'username', initialValue: '' },
    { name: 'email', initialValue: '' },
    { name: 'password', initialValue: '' },
    { name: 'confirmPassword', initialValue: '' },
  ]);

  const usernameField = fields.getFieldByName('username')!;
  const emailField = fields.getFieldByName('email')!;
  const passwordField = fields.getFieldByName('password')!;
  const confirmPasswordField = fields.getFieldByName('confirmPassword')!;

  // Use unified error handler for validation errors (shown before async operation)
  const { showError } = useUnifiedErrorHandler();

  // Use useAuthForm hook for consistent auth form handling
  const { isLoading, error, handleSubmit } = useAuthForm<{ message: string }>({
    onSubmit: async () => {
      const values = fields.getValues();
      return await register({
        username: values['username'] ?? '',
        email: values['email'] ?? '',
        password: values['password'] ?? '',
      });
    },
    validate: () => {
      const values = fields.getValues();

      // Validate passwords match
      const password = values['password'] ?? '';
      const confirmPassword = values['confirmPassword'] ?? '';
      const matchValidation = validatePasswordMatch(password, confirmPassword);
      if (!matchValidation.isValid && matchValidation.error) {
        showError('validation', matchValidation.error);
        return false;
      }

      // Validate password strength
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid && passwordValidation.error) {
        showError('validation', passwordValidation.error);
        return false;
      }

      return true;
    },
    onSuccess: result => {
      // Use the message from the backend (environment-aware)
      setSuccess(result.message);
    },
    onStart: () => {
      setSuccess('');
    },
  });

  return (
    <AuthFormContainer>
      <AuthFormHeader
        title="Create Account"
        description="Join the BendBionics community"
      />

      <form onSubmit={handleSubmit} className="space-y-4">
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
          username={usernameField.value}
          email={emailField.value}
          password={passwordField.value}
          confirmPassword={confirmPasswordField.value}
          setUsername={usernameField.setValue}
          setEmail={emailField.setValue}
          setPassword={passwordField.setValue}
          setConfirmPassword={confirmPasswordField.setValue}
        />

        <Button variant="primary" type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <AuthFormFooter
        promptText="Already have an account?"
        switchText="Sign in"
        onSwitch={onSwitchToLogin}
      />
    </AuthFormContainer>
  );
};
