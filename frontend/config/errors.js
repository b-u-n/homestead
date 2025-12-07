/**
 * Frontend Error Configuration
 *
 * This file configures error handling for network-related errors
 * that can be determined client-side. Backend errors should return
 * their own blocking status.
 */

export const ERROR_CONFIG = {
  // Network errors (frontend-determined)
  NETWORK_OFFLINE: {
    message: 'You appear to be offline',
    blocking: true
  },
  WEBSOCKET_DISCONNECTED: {
    message: 'Connection lost. Reconnecting...',
    blocking: false
  },
  WEBSOCKET_NOT_CONNECTED: {
    message: 'Not connected to server',
    blocking: false
  },
  REQUEST_TIMEOUT: {
    message: 'Request timed out. Please try again.',
    blocking: false
  },

  // Auth errors (blocking)
  SESSION_EXPIRED: {
    message: 'Session expired. Please log in again.',
    blocking: true
  },
  UNAUTHORIZED: {
    message: 'You are not authorized to perform this action.',
    blocking: true
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    message: 'Something went wrong. Please try again.',
    blocking: false
  }
};

/**
 * Get error config by code
 * @param {string} code - Error code
 * @returns {object} Error config with message and blocking status
 */
export function getErrorConfig(code) {
  return ERROR_CONFIG[code] || ERROR_CONFIG.UNKNOWN_ERROR;
}

/**
 * Determine if an error should be blocking based on context
 * @param {object} error - Error object from backend or network
 * @param {string} context - Where the error occurred
 * @returns {boolean} Whether error should be blocking
 */
export function isBlockingError(error, context) {
  // If backend explicitly says blocking, trust it
  if (error.blocking !== undefined) {
    return error.blocking;
  }

  // Check if it matches a known error code
  if (error.errorCode && ERROR_CONFIG[error.errorCode]) {
    return ERROR_CONFIG[error.errorCode].blocking;
  }

  // Network errors
  if (error.message?.includes('offline') || error.message?.includes('network')) {
    return true;
  }

  // Session/auth errors
  if (error.message?.toLowerCase().includes('session') ||
      error.message?.toLowerCase().includes('expired') ||
      error.message?.toLowerCase().includes('unauthorized')) {
    return true;
  }

  // Default to non-blocking
  return false;
}

export default ERROR_CONFIG;
