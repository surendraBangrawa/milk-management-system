/**
 * Logger Helper Utilities
 * Provides convenient wrappers for common logging patterns
 */

import logger from './logger';
import { LogLevel } from './logger';

/**
 * Wraps an async function with automatic error logging
 * 
 * Usage:
 *   const result = await withErrorLogging(
 *     async () => await apiCall(),
 *     'Failed to fetch data',
 *     { endpoint: '/api/users' }
 *   );
 */
export async function withErrorLogging<T>(
  fn: () => Promise<T>,
  errorMessage: string,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.error(errorMessage, error as Error, metadata);
    throw error; // Re-throw to maintain original behavior
  }
}

/**
 * Wraps a sync function with automatic error logging
 */
export function withErrorLoggingSync<T>(
  fn: () => T,
  errorMessage: string,
  metadata?: Record<string, any>
): T {
  try {
    return fn();
  } catch (error) {
    logger.error(errorMessage, error as Error, metadata);
    throw error;
  }
}

/**
 * Logs API call start
 */
export function logApiCall(
  method: string,
  url: string,
  metadata?: Record<string, any>
): void {
  logger.debug(`API Call: ${method.toUpperCase()} ${url}`, metadata);
}

/**
 * Logs API call success
 */
export function logApiSuccess(
  method: string,
  url: string,
  duration: number,
  metadata?: Record<string, any>
): void {
  logger.info(`API Success: ${method.toUpperCase()} ${url}`, {
    ...metadata,
    duration: `${duration}ms`,
  });
}

/**
 * Logs API call error
 */
export function logApiError(
  method: string,
  url: string,
  error: Error,
  metadata?: Record<string, any>
): void {
  logger.error(`API Error: ${method.toUpperCase()} ${url}`, error, {
    ...metadata,
    status: (error as any).response?.status,
    statusText: (error as any).response?.statusText,
  });
}

