import React, { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import './App.css';
import { NumberField } from './components/NumberField';
import { Toggle } from './components/Toggle';
import { HistoryPanel } from './components/HistoryPanel';
import {
  counterReducer,
  getDefaultCounterState,
  getPersistableState,
  sanitizePersistedState,
} from './flows/counterFlow';
import { clearAppState, loadAppState, saveAppState } from './utils/storage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function useStableHandlers(handlers) {
  // Prevent effect re-binding on every render while keeping latest callbacks.
  const ref = useRef(handlers);
  ref.current = handlers;
  return useMemo(
    () => ({
      onIncrement: () => ref.current.onIncrement?.(),
      onDecrement: () => ref.current.onDecrement?.(),
      onReset: () => ref.current.onReset?.(),
      onUndo: () => ref.current.onUndo?.(),
      onRedo: () => ref.current.onRedo?.(),
    }),
    []
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Feature-rich counter app with step, history, undo/redo, shortcuts, theme, persistence, and accessibility. */

  // Boundary: load persisted state once, sanitize into a valid state.
  const initialState = useMemo(() => {
    const { state: persisted } = loadAppState();
    return sanitizePersistedState(persisted);
  }, []);

  const [state, dispatch] = useReducer(counterReducer, initialState);

  // Apply theme to document root for CSS variable switching.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  // Persist key preferences & values.
  useEffect(() => {
    const persistable = getPersistableState(state);
    saveAppState(persistable);
  }, [state]);

  // Animation: bump + directional color when count changes.
  const countClassName = useMemo(() => {
    const base = ['countValue'];
    const dir = state.lastChange?.direction;
    if (dir === 'up') base.push('dir-up');
    if (dir === 'down') base.push('dir-down');
    if (state.lastChange?.type) base.push('bump');
    return base.join(' ');
  }, [state.lastChange]);

  // Remove bump class after the animation window (keeps UI responsive and deterministic).
  const [animKey, setAnimKey] = React.useState(0);
  useEffect(() => {
    if (!state.lastChange?.type) return;
    setAnimKey((k) => k + 1);
    const t = window.setTimeout(() => {
      // Clear lastChange by dispatching a no-op pattern is overkill; we just let CSS settle.
      // This timeout only exists to ensure re-trigger behavior is clean.
    }, 180);
    return () => window.clearTimeout(t);
  }, [state.lastChange]);

  const formattedCount = useMemo(() => String(state.count), [state.count]);

  // PUBLIC_INTERFACE
  const increment = useCallback(() => dispatch({ type: 'counter/increment' }), []);

  // PUBLIC_INTERFACE
  const decrement = useCallback(() => dispatch({ type: 'counter/decrement' }), []);

  // PUBLIC_INTERFACE
  const reset = useCallback(() => {
    // Reset is defined as a full app reset (count + preferences + history + undo/redo).
    // We clear persistence first to avoid briefly persisting an intermediate/stale state.
    clearAppState();
    dispatch({ type: 'counter/resetAll' });
  }, []);

  // PUBLIC_INTERFACE
  const undo = useCallback(() => dispatch({ type: 'counter/undo' }), []);

  // PUBLIC_INTERFACE
  const redo = useCallback(() => dispatch({ type: 'counter/redo' }), []);

  const clearHistory = useCallback(() => dispatch({ type: 'counter/clearHistory' }), []);

  const canUndo = state.past.length > 0;
  const canRedo = state.future.length > 0;

  const stableShortcutHandlers = useStableHandlers({
    onIncrement: increment,
    onDecrement: decrement,
    onReset: reset,
    onUndo: undo,
    onRedo: redo,
  });

  useKeyboardShortcuts(stableShortcutHandlers, true);

  return (
    <div className="App">
      <main className="app-shell">
        <section className="card" aria-label="Counter application">
          <header className="header">
            <div className="headerText">
              <h1 className="title">Counter</h1>
              <p className="subtitle">
                Step control, undo/redo, history, keyboard shortcuts, theme + persistence.
              </p>
            </div>

            <div className="topActions" aria-label="Top actions">
              <button
                type="button"
                className="btn btnSmall btnGhost"
                onClick={() =>
                  dispatch({
                    type: 'counter/setTheme',
                    payload: { theme: state.theme === 'dark' ? 'light' : 'dark' },
                  })
                }
                aria-label="Toggle theme"
              >
                Theme: {state.theme === 'dark' ? 'Dark' : 'Light'}
              </button>

              <button
                type="button"
                className="btn btnSmall btnGhost"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo last action"
                title="Undo (Ctrl/Cmd+Z)"
              >
                Undo
              </button>

              <button
                type="button"
                className="btn btnSmall btnGhost"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo last action"
                title="Redo (Ctrl/Cmd+Shift+Z)"
              >
                Redo
              </button>
            </div>
          </header>

          <div className="layout">
            <div>
              <div className="countWrap" aria-live="polite" aria-atomic="true">
                <div className="countLabel">Current count</div>
                <div
                  key={animKey}
                  className={countClassName}
                  data-testid="count-value"
                  aria-label={`Current count is ${formattedCount}`}
                >
                  {formattedCount}
                </div>
              </div>

              <div className="panels">
                <section className="panel" aria-label="Settings">
                  <h2 className="panelTitle">Settings</h2>
                  <div style={{ marginTop: 10, display: 'grid', gap: 12 }}>
                    <NumberField
                      label="Step value"
                      value={state.step}
                      min={1}
                      step={1}
                      helpText="Increment/decrement will change by this amount (minimum 1)."
                      onChange={(v) => dispatch({ type: 'counter/setStep', payload: { step: v } })}
                    />

                    <Toggle
                      id="allowNegative"
                      label="Allow negative values"
                      checked={state.allowNegative}
                      description="When disabled, the counter will not go below 0."
                      onChange={(checked) =>
                        dispatch({ type: 'counter/setAllowNegative', payload: { allowNegative: checked } })
                      }
                    />
                  </div>
                </section>

                <section className="panel" aria-label="Keyboard shortcuts">
                  <h2 className="panelTitle">Keyboard</h2>
                  <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
                    <div className="hint">
                      Increment: <span className="kbd">↑</span> <span className="kbd">+</span>
                    </div>
                    <div className="hint">
                      Decrement: <span className="kbd">↓</span> <span className="kbd">-</span>
                    </div>
                    <div className="hint">
                      Reset: <span className="kbd">0</span> <span className="kbd">R</span>
                    </div>
                    <div className="hint">
                      Undo/Redo: <span className="kbd">Ctrl/Cmd</span>+<span className="kbd">Z</span> /{' '}
                      <span className="kbd">Ctrl/Cmd</span>+<span className="kbd">Shift</span>+<span className="kbd">Z</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="actions" role="group" aria-label="Counter controls">
                <button type="button" className="btn btnPrimary" onClick={increment} aria-label="Increment counter">
                  Increment (+{state.step})
                </button>
                <button type="button" className="btn btnSecondary" onClick={decrement} aria-label="Decrement counter">
                  Decrement (-{state.step})
                </button>
                <button type="button" className="btn btnGhost" onClick={reset} aria-label="Reset counter to zero">
                  Reset
                </button>
              </div>

              <footer className="footer" aria-label="Footer">
                <span className="hint">
                  Preferences persist locally (count, step, negative setting, theme, history).
                </span>
                <span className="hint">Tip: Try the keyboard shortcuts.</span>
              </footer>
            </div>

            <HistoryPanel history={state.history} onClear={clearHistory} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
