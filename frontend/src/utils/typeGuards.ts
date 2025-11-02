/**
 * Shared Type Guards
 *
 * This module provides reusable type guard functions for common error and API response patterns.
 * Consolidates duplicate type guard implementations across the codebase.
 */

/**
 * Type guard for errors with response object (commonly used with axios errors)
 */
export function isErrorWithResponse(
  error: unknown
): error is { response: { status: number; data?: unknown } } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'response' in error &&
    error.response !== null &&
    typeof error.response === 'object' &&
    'status' in error.response
  );
}

/**
 * Type guard for API response with result structure (used for PCC computation responses)
 */
export function isApiResponseWithResult(response: unknown): response is {
  data: {
    result: {
      robot_positions: number[][][];
      segments?: number[][][];
      actuation_commands?: Record<string, unknown>;
      coupling_data?: unknown;
      tendon_analysis?: unknown;
    };
  };
} {
  return (
    response !== null &&
    typeof response === 'object' &&
    'data' in response &&
    response.data !== null &&
    typeof response.data === 'object' &&
    'result' in response.data &&
    response.data.result !== null &&
    typeof response.data.result === 'object' &&
    'robot_positions' in response.data.result
  );
}
