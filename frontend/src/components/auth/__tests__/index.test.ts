import { AuthPage, LoginForm, RegisterForm } from '@/components/auth';
import { describe, expect, it } from 'vitest';

describe('auth/index.ts', () => {
  it('exports AuthPage', () => {
    expect(AuthPage).toBeDefined();
    expect(typeof AuthPage).toBe('function');
  });

  it('exports LoginForm', () => {
    expect(LoginForm).toBeDefined();
    expect(typeof LoginForm).toBe('function');
  });

  it('exports RegisterForm', () => {
    expect(RegisterForm).toBeDefined();
    expect(typeof RegisterForm).toBe('function');
  });
});
