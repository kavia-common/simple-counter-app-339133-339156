import React, { useMemo } from 'react';

function formatTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}

function describe(entry) {
  const base =
    entry.type === 'increment'
      ? `Increment (+${entry.step})`
      : entry.type === 'decrement'
        ? `Decrement (-${entry.step})`
        : entry.type === 'reset'
          ? 'Reset'
          : entry.type;

  return `${base}: ${entry.prevCount} → ${entry.nextCount}`;
}

// PUBLIC_INTERFACE
export function HistoryPanel({ history, onClear }) {
  /** Shows recent actions with timestamps. */
  const items = useMemo(() => history || [], [history]);

  return (
    <section className="history" aria-label="History">
      <header className="historyHeader">
        <h2 className="panelTitle">History</h2>
        <button
          type="button"
          className="btn btnSmall btnGhost"
          onClick={onClear}
          disabled={!items.length}
        >
          Clear
        </button>
      </header>

      {items.length ? (
        <ul className="historyList" aria-label="Recent counter actions">
          {items.map((h) => (
            <li key={h.id} className="historyItem">
              <div className="historyMain">{describe(h)}</div>
              <div className="historyMeta">{formatTime(h.timestamp)}</div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="historyEmpty">No actions yet.</div>
      )}
    </section>
  );
}
