/**
 * Small adapter layer for localStorage access.
 * Keeps parsing/serialization, validation, and error handling out of UI components.
 */

const APP_STORAGE_KEY = 'kavia.counterApp.v1';

// PUBLIC_INTERFACE
export function loadAppState() {
  /**
   * Loads the persisted application state from localStorage.
   *
   * Contract:
   * - Inputs: none
   * - Outputs: { state: object|null, error: Error|null }
   * - Errors: never throws; returns {error} when parsing/IO fails
   * - Side effects: reads localStorage
   */
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) return { state: null, error: null };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return { state: null, error: new Error('Persisted state is not an object') };
    }
    return { state: parsed, error: null };
  } catch (err) {
    return { state: null, error: err instanceof Error ? err : new Error('Failed to load state') };
  }
}

// PUBLIC_INTERFACE
export function saveAppState(state) {
  /**
   * Saves the provided application state to localStorage.
   *
   * Contract:
   * - Inputs: state (plain JSON-serializable object)
   * - Outputs: { ok: boolean, error: Error|null }
   * - Errors: never throws; returns {error} when serialization/IO fails
   * - Side effects: writes localStorage
   */
  try {
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error('Failed to save state') };
  }
}

// PUBLIC_INTERFACE
export function clearAppState() {
  /**
   * Clears the persisted application state from localStorage.
   *
   * Contract:
   * - Inputs: none
   * - Outputs: { ok: boolean, error: Error|null }
   * - Errors: never throws; returns {error} when removal fails
   * - Side effects: removes the app storage key from localStorage
   */
  try {
    window.localStorage.removeItem(APP_STORAGE_KEY);
    return { ok: true, error: null };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err : new Error('Failed to clear state') };
  }
}
