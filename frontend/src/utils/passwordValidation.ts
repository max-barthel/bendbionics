/**
 * Password Validation Utility
 *
 * Centralized password validation logic to ensure consistency
 * across all authentication forms and password update flows.
 */

/**
 * Password validation constants
 */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_BYTES = 72; // bcrypt limit

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  readonly isValid: boolean;
  readonly error?: string;
}

/**
 * Validates password strength according to application requirements
 *
 * @param password - The password to validate
 * @param fieldName - Optional field name for error messages (e.g., "Password", "New password")
 * @returns Validation result with isValid flag and optional error message
 */
export function validatePassword(
  password: string,
  fieldName: string = 'Password'
): PasswordValidationResult {
  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      isValid: false,
      error: `${fieldName} must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }

  // Check for bcrypt 72-byte limit
  const byteLength = new TextEncoder().encode(password).length;
  if (byteLength > MAX_PASSWORD_BYTES) {
    return {
      isValid: false,
      error: `${fieldName} is too long. Please use a password with ${MAX_PASSWORD_BYTES} characters or less.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates that two passwords match
 *
 * @param password - The original password
 * @param confirmPassword - The password confirmation
 * @param fieldName - Optional field name for error messages (default: "Passwords")
 * @returns Validation result with isValid flag and optional error message
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string,
  fieldName: string = 'Passwords'
): PasswordValidationResult {
  if (password !== confirmPassword) {
    return {
      isValid: false,
      error: `${fieldName} do not match`,
    };
  }

  return { isValid: true };
}

