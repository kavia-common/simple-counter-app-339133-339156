import { useEffect } from 'react';

function isEditableTarget(target) {
  if (!target) return false;
  const el = target;
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return Boolean(el.isContentEditable);
}

// PUBLIC_INTERFACE
export function useKeyboardShortcuts(handlers, enabled = true) {
  /**
   * Registers keyboard shortcuts for the counter app.
   *
   * Contract:
   * - Inputs:
   *   - handlers: { onIncrement, onDecrement, onReset, onUndo, onRedo }
   *   - enabled: boolean
   * - Outputs: none
   * - Errors: none (does not throw)
   * - Side effects: attaches window keydown listener while enabled
   *
   * Shortcuts:
   * - Increment: ArrowUp, '+', '='
   * - Decrement: ArrowDown, '-','_'
   * - Reset: '0' or 'r'
   * - Undo: Ctrl/Cmd+Z
   * - Redo: Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y
   *
   * Notes:
   * - Does not fire when focused in an input/textarea/select/contentEditable element.
   */
  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (e) => {
      if (isEditableTarget(e.target)) return;

      const key = e.key;

      // Undo/redo
      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && (key === 'z' || key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) handlers.onRedo?.();
        else handlers.onUndo?.();
        return;
      }
      if (isMod && (key === 'y' || key === 'Y')) {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }

      // Counter controls
      if (key === 'ArrowUp' || key === '+' || key === '=') {
        e.preventDefault();
        handlers.onIncrement?.();
      } else if (key === 'ArrowDown' || key === '-' || key === '_') {
        e.preventDefault();
        handlers.onDecrement?.();
      } else if (key === '0' || key === 'r' || key === 'R') {
        e.preventDefault();
        handlers.onReset?.();
      }
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, handlers]);
}
