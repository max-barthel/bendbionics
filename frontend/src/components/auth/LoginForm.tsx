import { FormField, FormMessage, PrimaryButton } from '@/components/ui';
import { useFormFields } from '@/features/shared';
import { useAuth } from '@/providers';
import { useNavigate } from 'react-router-dom';
import { AuthFormContainer } from './AuthFormContainer';
import { AuthFormFooter } from './AuthFormFooter';
import { AuthFormHeader } from './AuthFormHeader';
import { useAuthForm } from './hooks/useAuthForm';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginFormFields: React.FC<{
  username: string;
  password: string;
  setUsername: (value: string | number) => void;
  setPassword: (value: string | number) => void;
}> = ({ username, password, setUsername, setPassword }) => (
  <>
    <FormField
      id="username"
      label="Username"
      type="text"
      value={username}
      onChange={setUsername}
      placeholder="Enter your username"
    />

    <FormField
      id="password"
      label="Password"
      type="password"
      value={password}
      onChange={setPassword}
      placeholder="Enter your password"
    />
  </>
);

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Manage form fields with useFormFields hook
  const fields = useFormFields([
    { name: 'username', initialValue: '' },
    { name: 'password', initialValue: '' },
  ]);

  const usernameField = fields.getFieldByName('username')!;
  const passwordField = fields.getFieldByName('password')!;

  // Use useAuthForm hook for consistent auth form handling
  const { isLoading, error, handleSubmit } = useAuthForm({
    onSubmit: async () => {
      const values = fields.getValues();
      await login({ username: values['username'], password: values['password'] });
    },
    onSuccess: () => {
      // Redirect to main app after successful login
      navigate('/');
    },
  });

  return (
    <AuthFormContainer>
      <AuthFormHeader title="Welcome Back" description="Sign in to your account" />

      <form onSubmit={handleSubmit} className="space-y-4">
        {error.visible && (
          <FormMessage message={error.message} type="error" variant="standard" />
        )}
        <LoginFormFields
          username={usernameField.value}
          password={passwordField.value}
          setUsername={usernameField.setValue}
          setPassword={passwordField.setValue}
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
