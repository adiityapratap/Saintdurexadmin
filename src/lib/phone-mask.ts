/**
 * Phone Number Formatting Utility
 * Accepts any phone number format
 */

/**
 * Formats phone number as user types
 * Now accepts any phone number format without strict validation
 */
export const formatAustralianPhone = (value: string, previousValue: string = ""): string => {
  // Simply return the value as-is, allowing any format
  // Only limit the length to 20 characters for reasonable input
  return value.slice(0, 20)
}

/**
 * Validates if the phone number format is valid
 * Returns true if valid or empty (optional field)
 * Now accepts any phone number format (international, mobile, landline, etc.)
 */
export const isValidAustralianPhoneFormat = (value: string): boolean => {
  if (!value || value.trim() === '') {
    return true // Optional field
  }

  // Accept any phone number with at least 3 characters
  // This allows international formats, mobile, landline, etc.
  return value.trim().length >= 3
}

/**
 * Removes formatting from phone number (keeps only digits and +)
 * Useful for storing in database
 */
export const cleanPhoneNumber = (value: string): string => {
  if (!value) return ''
  // Keep + for international numbers, remove everything else
  if (value.startsWith('+61')) {
    return `+61${value.slice(3).replaceAll(/\D/g, '')}`
  }
  if (value.startsWith('+')) {
    return value.replaceAll(/[^\d+]/g, '')
  }
  // Remove all non-digits for local numbers
  return value.replaceAll(/\D/g, '')
}

/**
 * Phone number input handler for React
 * Formats as user types (allows any format)
 */
export const handlePhoneInput = (
  value: string,
  previousValue: string,
  onChange: (value: string) => void
): void => {
  const formatted = formatAustralianPhone(value, previousValue)
  onChange(formatted)
}

/**
 * Phone number mask pattern for input placeholder
 */
export const getPhonePlaceholder = (): string => {
  return 'Enter phone number'
}

/**
 * Gets validation error message for phone number
 * Now accepts any phone number format - no validation errors
 */
export const getPhoneValidationError = (value: string): string | undefined => {
  if (!value || value.trim() === '') {
    return undefined // Optional field
  }

  // Accept any phone number - no validation errors
  return undefined
}
