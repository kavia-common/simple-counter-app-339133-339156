/**
 * CounterFlow (reusable flow, not UI):
 * - Single canonical reducer + action creators for counter operations.
 * - Contains history/undo/redo and action log with timestamps.
 * - UI should only dispatch actions; no duplicated counter logic.
 */

const HISTORY_LIMIT = 50;

function nowIso() {
  return new Date().toISOString();
}

function clampNonNegative(value) {
  return Math.max(0, value);
}

function sanitizeStep(step) {
  const n = Number(step);
  if (!Number.isFinite(n)) return 1;
  // Invariant: step is a positive integer >= 1.
  return Math.max(1, Math.floor(n));
}

function sanitizeBoolean(v) {
  return Boolean(v);
}

function sanitizeTheme(theme) {
  return theme === 'dark' ? 'dark' : 'light';
}

function applyNoNegativeGuard(nextCount, allowNegative) {
  return allowNegative ? nextCount : clampNonNegative(nextCount);
}

function pushHistory(history, entry) {
  const next = [entry, ...history];
  if (next.length > HISTORY_LIMIT) return next.slice(0, HISTORY_LIMIT);
  return next;
}

function makeHistoryEntry({ type, prevCount, nextCount, step }) {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    timestamp: nowIso(),
    prevCount,
    nextCount,
    step,
  };
}

/**
 * Creates a snapshot suitable for undo/redo.
 *
 * Invariant:
 * - All snapshots have the same shape so undo/redo restore is deterministic across action types.
 * - `past` and `future` are intentionally excluded to avoid deep/recursive structures.
 */
function deepFreezeDev(obj) {
  // Defensive helper: catch accidental snapshot mutations during development/tests.
  // In production this is a no-op (no runtime cost).
  if (process.env.NODE_ENV === 'production' || !obj || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreezeDev(value);
    }
  }
  return obj;
}

/**
 * Creates a snapshot suitable for undo/redo.
 *
 * Contract:
 * - Inputs: current CounterState
 * - Outputs: plain snapshot object that is safe to store in history stacks
 * - Errors: none
 * - Side effects: none (dev-only deepFreeze to prevent accidental mutation)
 *
 * Invariants:
 * - Snapshot must be immutable-by-convention: no references that can be mutated later.
 * - `past` and `future` are excluded to avoid recursive structures.
 */
function makeUndoSnapshot(state) {
  const snapshot = {
    count: state.count,
    // Enforce numeric step in snapshots even if a UI bug or persisted blob ever supplies a string.
    step: sanitizeStep(state.step),
    allowNegative: state.allowNegative,
    theme: state.theme,
    // Clone arrays so snapshots can't be affected by later changes.
    history: Array.isArray(state.history) ? state.history.slice() : [],
  };

  return deepFreezeDev(snapshot);
}

// PUBLIC_INTERFACE
export function getDefaultCounterState() {
  /**
   * Returns default state for CounterFlow.
   *
   * Contract:
   * - Inputs: none
   * - Outputs: CounterState
   * - Errors: none
   * - Side effects: none
   */
  return {
    count: 0,
    step: 1,
    allowNegative: true,
    theme: 'light',
    history: [],
    past: [],
    future: [],
    lastChange: null, // { type: 'increment'|'decrement'|'reset'|'setCount', direction: 'up'|'down'|'neutral', at: ISO }
  };
}

// PUBLIC_INTERFACE
export function sanitizePersistedState(maybeState) {
  /**
   * Sanitizes a persisted state blob into a valid CounterState.
   *
   * Contract:
   * - Inputs: maybeState (unknown)
   * - Outputs: CounterState (always valid)
   * - Errors: none (best-effort sanitize)
   * - Side effects: none
   */
  const base = getDefaultCounterState();
  if (!maybeState || typeof maybeState !== 'object') return base;

  const count = Number(maybeState.count);
  const step = sanitizeStep(maybeState.step);
  const allowNegative = sanitizeBoolean(maybeState.allowNegative);
  const theme = sanitizeTheme(maybeState.theme);

  const safeCount = Number.isFinite(count) ? applyNoNegativeGuard(count, allowNegative) : base.count;

  // We intentionally do not restore undo/redo stacks across sessions (keeps persistence small and simpler).
  // We DO restore history (recent actions).
  const history = Array.isArray(maybeState.history) ? maybeState.history.slice(0, HISTORY_LIMIT) : [];

  return {
    ...base,
    count: safeCount,
    step,
    allowNegative,
    theme,
    history,
  };
}

// PUBLIC_INTERFACE
export function counterReducer(state, action) {
  /**
   * Canonical reducer for all counter operations.
   *
   * Contract:
   * - Inputs:
   *   - state: CounterState
   *   - action: { type: string, payload?: any }
   * - Outputs: next CounterState
   * - Errors: never throws; unknown actions return state unchanged
   * - Side effects: none
   */
  switch (action.type) {
    case 'counter/setStep': {
      const step = sanitizeStep(action.payload?.step);
      return { ...state, step };
    }

    case 'counter/setAllowNegative': {
      const allowNegative = sanitizeBoolean(action.payload?.allowNegative);
      const count = applyNoNegativeGuard(state.count, allowNegative);
      return { ...state, allowNegative, count };
    }

    case 'counter/setTheme': {
      const theme = sanitizeTheme(action.payload?.theme);
      return { ...state, theme };
    }

    case 'counter/increment': {
      const prevCount = state.count;
      const step = sanitizeStep(state.step);
      const nextCount = applyNoNegativeGuard(prevCount + step, state.allowNegative);

      const entry = makeHistoryEntry({
        type: 'increment',
        prevCount,
        nextCount,
        step,
      });

      return {
        ...state,
        // Store snapshot of *current* state, but with a numeric step (handled inside makeUndoSnapshot).
        past: [...state.past, makeUndoSnapshot(state)],
        future: [],
        count: nextCount,
        // Keep state.step numeric going forward.
        step,
        history: pushHistory(state.history, entry),
        lastChange: { type: 'increment', direction: 'up', at: entry.timestamp },
      };
    }

    case 'counter/decrement': {
      const prevCount = state.count;
      const step = sanitizeStep(state.step);
      const nextCount = applyNoNegativeGuard(prevCount - step, state.allowNegative);

      // If no-negative is enabled and we are already at 0, keep behavior deterministic:
      // still record the action (attempt) only if it changes value.
      if (nextCount === prevCount) {
        return {
          ...state,
          step,
          lastChange: { type: 'decrement', direction: 'neutral', at: nowIso() },
        };
      }

      const entry = makeHistoryEntry({
        type: 'decrement',
        prevCount,
        nextCount,
        step,
      });

      return {
        ...state,
        past: [...state.past, makeUndoSnapshot(state)],
        future: [],
        count: nextCount,
        step,
        history: pushHistory(state.history, entry),
        lastChange: { type: 'decrement', direction: 'down', at: entry.timestamp },
      };
    }

    case 'counter/reset': {
      // Count-only reset (kept for backwards compatibility).
      const prevCount = state.count;
      const nextCount = applyNoNegativeGuard(0, state.allowNegative);

      const entry = makeHistoryEntry({
        type: 'reset',
        prevCount,
        nextCount,
        step: state.step,
      });

      return {
        ...state,
        past: [...state.past, makeUndoSnapshot(state)],
        future: [],
        count: nextCount,
        history: pushHistory(state.history, entry),
        lastChange: { type: 'reset', direction: 'neutral', at: entry.timestamp },
      };
    }

    case 'counter/resetAll': {
      /**
       * Full application reset.
       *
       * Contract:
       * - Inputs: none
       * - Outputs: CounterState reset to defaults, with undo enabling return to the pre-reset state
       * - Errors: never throws
       * - Side effects: none
       *
       * Invariants:
       * - After resetAll, step=1, allowNegative=true, theme='light', history cleared, future cleared.
       * - Undo returns to the state prior to resetAll.
       */
      const defaults = getDefaultCounterState();

      // Store a snapshot of the previous state for undo.
      // Snapshot contract is unified across all actions via makeUndoSnapshot().
      const snapshot = makeUndoSnapshot(state);

      return {
        ...defaults,
        past: [...state.past, snapshot],
        future: [],
        lastChange: { type: 'resetAll', direction: 'neutral', at: nowIso() },
      };
    }

    case 'counter/undo': {
      if (!state.past.length) return state;
      const previous = state.past[state.past.length - 1];

      const futureSnapshot = makeUndoSnapshot(state);

      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [futureSnapshot, ...state.future],
        ...previous,
        // Ensure restored step is numeric and invariant-compliant even if snapshot was polluted.
        step: sanitizeStep(previous.step),
        lastChange: { type: 'undo', direction: 'neutral', at: nowIso() },
      };
    }

    case 'counter/redo': {
      if (!state.future.length) return state;
      const next = state.future[0];

      const pastSnapshot = makeUndoSnapshot(state);

      return {
        ...state,
        past: [...state.past, pastSnapshot],
        future: state.future.slice(1),
        ...next,
        step: sanitizeStep(next.step),
        lastChange: { type: 'redo', direction: 'neutral', at: nowIso() },
      };
    }

    case 'counter/clearHistory': {
      return { ...state, history: [] };
    }

    default:
      return state;
  }
}

// PUBLIC_INTERFACE
export function getPersistableState(state) {
  /**
   * Returns the subset of state that should be persisted.
   *
   * Contract:
   * - Inputs: CounterState
   * - Outputs: plain object (JSON-serializable)
   * - Errors: none
   * - Side effects: none
   */
  return {
    count: state.count,
    step: state.step,
    allowNegative: state.allowNegative,
    theme: state.theme,
    history: state.history,
  };
}
