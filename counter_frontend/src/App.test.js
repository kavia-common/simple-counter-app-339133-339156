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
