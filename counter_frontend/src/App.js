import React, { useMemo, useState } from 'react';
import './App.css';

// PUBLIC_INTERFACE
function App() {
  /** Main Counter App UI: shows current count and provides increment/decrement/reset actions. */
  const [count, setCount] = useState(0);

  // Keep formatting logic centralized and testable.
  const formattedCount = useMemo(() => String(count), [count]);

  // PUBLIC_INTERFACE
  const increment = () => setCount((c) => c + 1);

  // PUBLIC_INTERFACE
  const decrement = () => setCount((c) => c - 1);

  // PUBLIC_INTERFACE
  const reset = () => setCount(0);

  return (
    <div className="App">
      <main className="app-shell">
        <section className="card" aria-label="Counter">
          <header className="header">
            <h1 className="title">Counter</h1>
            <p className="subtitle">A simple, responsive counter with modern light styling.</p>
          </header>

          <div className="countWrap" aria-live="polite">
            <div className="countLabel">Current count</div>
            <div className="countValue" data-testid="count-value">
              {formattedCount}
            </div>
          </div>

          <div className="actions" role="group" aria-label="Counter controls">
            <button type="button" className="btn btnPrimary" onClick={increment}>
              Increment
            </button>
            <button type="button" className="btn btnSecondary" onClick={decrement}>
              Decrement
            </button>
            <button type="button" className="btn btnGhost" onClick={reset}>
              Reset
            </button>
          </div>

          <footer className="footer">
            <span className="hint">Tip: Works great on mobile and desktop.</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

export default App;
