/**
 * EliteCare Hospital Validation Utilities
 * Strict validation rules for Email and Mobile/Contact Numbers
 */

// Email regex strictly requiring @gmail.com domain
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

// Mobile/contact number regex supporting standard 10-digit, 11-digit, and international +country-code formats
export const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

/**
 * Validates email address format strictly requiring @gmail.com
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validates mobile / contact number format
 * @param {string} phone
 * @param {boolean} isRequired
 * @returns {boolean}
 */
export const isValidPhone = (phone, isRequired = false) => {
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return !isRequired;
  }
  return PHONE_REGEX.test(phone.trim());
};

/**
 * Returns user-friendly validation error message for email, or null if valid
 * @param {string} email
 * @returns {string|null}
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid @gmail.com email address';
  }
  return null;
};

/**
 * Returns user-friendly validation error message for phone/mobile number, or null if valid
 * @param {string} phone
 * @param {boolean} isRequired
 * @returns {string|null}
 */
export const validatePhone = (phone, isRequired = false) => {
  if (!phone || phone.trim() === '') {
    if (isRequired) return 'Mobile number is required';
    return null;
  }
  if (!isValidPhone(phone, isRequired)) {
    return 'Please fill a valid mobile/contact number (e.g., 9876543210 or +1-555-0199)';
  }
  return null;
};

/**
 * Sanitizes email by trimming and converting to lowercase
 * @param {string} email
 * @returns {string}
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Cleans phone string by trimming
 * @param {string} phone
 * @returns {string}
 */
export const cleanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.trim();
};
