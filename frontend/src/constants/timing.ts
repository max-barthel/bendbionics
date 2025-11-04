/**
 * Timing Constants
 *
 * Centralized timing values for delays, debounces, timeouts, and intervals.
 * This eliminates magic numbers throughout the codebase and makes timing behavior explicit.
 */

/**
 * Debounce and throttle delays (in milliseconds)
 */
export const DEBOUNCE_DELAYS = {
  /** Field commit debounce - delay before auto-computing after field changes */
  FIELD_COMMIT: 250,

  /** Form submission debounce - delay before submitting form */
  FORM_SUBMIT: 300,
} as const;

/**
 * State synchronization delays (in milliseconds)
 * Used when waiting for React state updates to propagate
 */
export const STATE_SYNC_DELAYS = {
  /** Delay after preset load to let state updates propagate */
  PRESET_LOAD: 100,

  /** Delay for configuration loader state application */
  CONFIGURATION_LOADER: 100,

  /** Delay for preset loading completion state update */
  PRESET_LOADING_COMPLETE: 0, // Immediate for synchronous operations

  /** Delay for auto-load preset computation trigger */
  AUTO_LOAD_PRESET_COMPUTE: 0, // Immediate after preset load
} as const;

/**
 * UI animation and transition delays (in milliseconds)
 */
export const UI_DELAYS = {
  /** Delay after modal actions before triggering callbacks */
  MODAL_ACTION: 120,

  /** Delay for DOM rendering synchronization */
  DOM_RENDER: 100,

  /** Delay for dialog rendering synchronization */
  DIALOG_RENDER: 0, // Immediate when using requestAnimationFrame

  /** Delay for scroll adjustment operations */
  SCROLL_ADJUSTMENT: 100,
} as const;

/**
 * Error and notification delays (in milliseconds)
 */
export const ERROR_DELAYS = {
  /** Default auto-hide delay for error messages */
  ERROR_AUTO_HIDE: 5000,

  /** Delay for notification auto-dismiss */
  NOTIFICATION_AUTO_DISMISS: 5000,
} as const;

/**
 * Initialization and setup delays (in milliseconds)
 */
export const INIT_DELAYS = {
  /** Delay for app initialization completion */
  APP_INIT: 0, // Immediate after setup

  /** Delay for auto-loading presets on first visit */
  AUTO_LOAD_PRESET: 500,
} as const;

/**
 * Authentication delays (in milliseconds)
 */
export const AUTH_DELAYS = {
  /** Timeout for authentication check */
  AUTH_CHECK_TIMEOUT: 5000,
} as const;

/**
 * API and network timeouts (in milliseconds)
 */
export const API_TIMEOUTS = {
  /** Default API request timeout */
  DEFAULT: 30000,

  /** Test timeout for async operations */
  TEST: 1000,
} as const;

