/**
 * Validates username format
 * Rules:
 * - 3-20 characters long
 * - Only letters, numbers, and underscores
 * - Must start with a letter
 */
export const validateUsername = (username: string): boolean => {
  if (!username) return false;
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/;
  return usernameRegex.test(username);
};

/**
 * Validates email format
 * Rules:
 * - Standard email format
 * - TLD required
 * - No special characters except . _ -
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 * Rules:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const validatePassword = (password: string): boolean => {
  if (!password || password.length < 12) return false;
  
  const passwordRules = {
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /[0-9]/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  };

  return Object.values(passwordRules).every(rule => rule.test(password));
};

/**
 * Helper function to validate string length
 */
export const validateLength = (str: string, min: number, max: number): boolean => {
  if (!str) return false;
  const length = str.trim().length;
  return length >= min && length <= max;
};
