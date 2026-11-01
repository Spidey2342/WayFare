export function friendlyAuthError(error: unknown): string {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: string }).message)
      : '';

  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'That email or password is not correct. Try again or reset your password.';
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'That email already has an account. Sign in instead.';
  }
  if (lower.includes('password') && lower.includes('weak')) {
    return 'Choose a stronger password (at least 8 characters).';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Check your inbox to confirm your email, then sign in.';
  }

  return message || 'Something went wrong. Please try again.';
}
