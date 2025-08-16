/**
 * Get current ISO timestamp
 */
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

/**
 * Get current ISO timestamp (alias)
 */
export function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Convert milliseconds to seconds
 */
export function msToSeconds(ms) {
  return Math.floor(ms / 1000);
}

/**
 * Convert seconds to milliseconds
 */
export function secondsToMs(seconds) {
  return seconds * 1000;
}

/**
 * Check if timestamp is expired
 */
export function isExpired(timestamp, timeoutMs) {
  return Date.now() - new Date(timestamp).getTime() > timeoutMs;
}
