import { describe, expect, it } from 'vitest';
import { AuthPage, LoginForm, RegisterForm } from '../index';

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
