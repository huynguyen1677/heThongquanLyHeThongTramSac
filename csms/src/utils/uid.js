import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique message ID for OCPP calls
 */
export function generateMessageId() {
  return uuidv4();
}

/**
 * Generate unique ID (alias for compatibility)
 */
export function generateUID() {
  return uuidv4();
}

/**
 * Generate transaction ID (integer)
 */
export function generateTransactionId() {
  return Math.floor(Math.random() * 1000000) + 1;
}

/**
 * Generate station ID if not provided
 */
export function generateStationId() {
  return `CP_${uuidv4().slice(0, 8).toUpperCase()}`;
}
