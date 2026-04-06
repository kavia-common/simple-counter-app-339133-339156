import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

function renderApp() {
  return render(<App />);
}

async function expectCountToBe(value) {
  // In React 18, state updates can be async/batched; wait until DOM reflects the update.
  await waitFor(() => {
    expect(screen.getByTestId('count-value')).toHaveTextContent(String(value));
  });
}

beforeEach(() => {
  // Extra isolation beyond setupTests.js to prevent any leaking between tests,
  // especially if a test fails before global hooks complete.
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

test('renders the counter with initial value 0', async () => {
  renderApp();
  expect(screen.getByRole('heading', { name: /counter/i })).toBeInTheDocument();
  await expectCountToBe(0);
});

test('increment, decrement, and reset buttons update the count (default step=1)', async () => {
  const user = userEvent.setup();
  renderApp();

  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const decrementBtn = screen.getByRole('button', { name: /decrement/i });
  const resetBtn = screen.getByRole('button', { name: /reset/i });

  await expectCountToBe(0);

  await user.click(incrementBtn);
  await user.click(incrementBtn);
  await expectCountToBe(2);

  await user.click(decrementBtn);
  await expectCountToBe(1);

  await user.click(resetBtn);
  await expectCountToBe(0);
});

test('reset fully restores defaults and interacts correctly with undo/redo + persistence', async () => {
  const user = userEvent.setup();
  const { unmount } = renderApp();

  const stepInput = screen.getByLabelText(/step value/i);
  const allowNegativeToggle = screen.getByRole('switch', { name: /allow negative values/i });
  const themeBtn = screen.getByRole('button', { name: /toggle theme/i });

  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const resetBtn = screen.getByRole('button', { name: /reset/i });
  const undoBtn = screen.getByRole('button', { name: /undo last action/i });
  const redoBtn = screen.getByRole('button', { name: /redo last action/i });

  // Change multiple parts of state.
  await user.clear(stepInput);
  await user.type(stepInput, '5');
  await user.click(allowNegativeToggle); // toggles OFF (false)
  const themeBefore = themeBtn.textContent;
  await user.click(themeBtn);
  expect(themeBtn.textContent).not.toEqual(themeBefore);

  await user.click(incrementBtn); // +5
  await expectCountToBe(5);

  // Full reset: defaults.
  await user.click(resetBtn);
  await expectCountToBe(0);

  // Step should be back to 1 (input value reflects controlled state)
  await waitFor(() => {
    expect(screen.getByLabelText(/step value/i)).toHaveValue(1);
  });

  // Allow negative defaults to true (switch checked)
  expect(screen.getByRole('switch', { name: /allow negative values/i })).toBeChecked();

  // Theme defaults to Light.
  expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveTextContent(/theme:\s*light/i);

  // Undo should restore the pre-reset state (count back to 5, step 5).
  await user.click(undoBtn);
  await expectCountToBe(5);
  await waitFor(() => {
    expect(screen.getByLabelText(/step value/i)).toHaveValue(5);
  });

  // Redo should re-apply reset (count 0, step 1).
  await user.click(redoBtn);
  await expectCountToBe(0);
  await waitFor(() => {
    expect(screen.getByLabelText(/step value/i)).toHaveValue(1);
  });

  // Persistence: after reset, a remount should start from defaults.
  // (We don't rely on internal storage key; we just confirm UI starts from defaults.)
  unmount();
  renderApp();
  await expectCountToBe(0);
  await waitFor(() => {
    expect(screen.getByLabelText(/step value/i)).toHaveValue(1);
  });
  expect(screen.getByRole('switch', { name: /allow negative values/i })).toBeChecked();
  expect(screen.getByRole('button', { name: /toggle theme/i })).toHaveTextContent(/theme:\s*light/i);
});

test('step value affects increment/decrement', async () => {
  const user = userEvent.setup();
  renderApp();

  const stepInput = screen.getByLabelText(/step value/i);
  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const decrementBtn = screen.getByRole('button', { name: /decrement/i });

  await expectCountToBe(0);

  // Ensure we fully replace any existing value (robust across browsers/JSDOM).
  await user.clear(stepInput);
  await user.type(stepInput, '5');

  await user.click(incrementBtn);
  await expectCountToBe(5);

  await user.click(decrementBtn);
  await expectCountToBe(0);
});

test('disabling negative values prevents count from going below zero', async () => {
  const user = userEvent.setup();
  renderApp();

  const allowNegativeToggle = screen.getByRole('switch', { name: /allow negative values/i });
  const decrementBtn = screen.getByRole('button', { name: /decrement/i });

  await expectCountToBe(0);

  // turn OFF allow negative
  await user.click(allowNegativeToggle);

  await user.click(decrementBtn);
  await expectCountToBe(0);
});

test('undo and redo work for counter changes', async () => {
  const user = userEvent.setup();
  renderApp();

  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const undoBtn = screen.getByRole('button', { name: /undo last action/i });
  const redoBtn = screen.getByRole('button', { name: /redo last action/i });

  await user.click(incrementBtn);
  await user.click(incrementBtn);
  await expectCountToBe(2);

  await user.click(undoBtn);
  await expectCountToBe(1);

  await user.click(redoBtn);
  await expectCountToBe(2);
});

test('theme toggle updates label', async () => {
  const user = userEvent.setup();
  renderApp();

  const themeBtn = screen.getByRole('button', { name: /toggle theme/i });
  expect(themeBtn).toHaveTextContent(/light|dark/i);

  const before = themeBtn.textContent;
  await user.click(themeBtn);

  await waitFor(() => {
    expect(themeBtn.textContent).not.toEqual(before);
  });
});
