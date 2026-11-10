export const MIN_PASSWORD_LENGTH = 8;

// Returns an error message, or null if the password is acceptable.
export function validateNewPassword(password: unknown): string | null {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}
