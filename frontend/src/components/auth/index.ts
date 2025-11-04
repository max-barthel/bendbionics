export { AuthFormContainer } from './AuthFormContainer';
export { AuthFormFooter } from './AuthFormFooter';
export { AuthFormHeader } from './AuthFormHeader';
export { AuthPage } from './AuthPage';
export { LoginForm } from './LoginForm';
export { RegisterForm } from './RegisterForm';

// Hooks
// Re-export auth hooks from features/auth for backward compatibility
export {
  useAuthForm,
  type UseAuthFormOptions,
  type UseAuthFormReturn,
} from '@/features/auth';
