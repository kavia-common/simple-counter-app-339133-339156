import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the counter with initial value 0', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /counter/i })).toBeInTheDocument();
  expect(screen.getByTestId('count-value')).toHaveTextContent('0');
});

test('increment, decrement, and reset buttons update the count (default step=1)', async () => {
  const user = userEvent.setup();
  render(<App />);

  const count = screen.getByTestId('count-value');
  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const decrementBtn = screen.getByRole('button', { name: /decrement/i });
  const resetBtn = screen.getByRole('button', { name: /reset/i });

  expect(count).toHaveTextContent('0');

  await user.click(incrementBtn);
  await user.click(incrementBtn);
  expect(count).toHaveTextContent('2');

  await user.click(decrementBtn);
  expect(count).toHaveTextContent('1');

  await user.click(resetBtn);
  expect(count).toHaveTextContent('0');
});

test('step value affects increment/decrement', async () => {
  const user = userEvent.setup();
  render(<App />);

  const count = screen.getByTestId('count-value');
  const stepInput = screen.getByLabelText(/step value/i);

  await user.clear(stepInput);
  await user.type(stepInput, '5');

  await user.click(screen.getByRole('button', { name: /increment/i }));
  expect(count).toHaveTextContent('5');

  await user.click(screen.getByRole('button', { name: /decrement/i }));
  expect(count).toHaveTextContent('0');
});

test('disabling negative values prevents count from going below zero', async () => {
  const user = userEvent.setup();
  render(<App />);

  const count = screen.getByTestId('count-value');
  const allowNegativeToggle = screen.getByRole('switch', { name: /allow negative values/i });
  const decrementBtn = screen.getByRole('button', { name: /decrement/i });

  // turn OFF allow negative
  await user.click(allowNegativeToggle);

  await user.click(decrementBtn);
  expect(count).toHaveTextContent('0');
});

test('undo and redo work for counter changes', async () => {
  const user = userEvent.setup();
  render(<App />);

  const count = screen.getByTestId('count-value');
  const incrementBtn = screen.getByRole('button', { name: /increment/i });
  const undoBtn = screen.getByRole('button', { name: /undo last action/i });
  const redoBtn = screen.getByRole('button', { name: /redo last action/i });

  await user.click(incrementBtn);
  await user.click(incrementBtn);
  expect(count).toHaveTextContent('2');

  await user.click(undoBtn);
  expect(count).toHaveTextContent('1');

  await user.click(redoBtn);
  expect(count).toHaveTextContent('2');
});

test('theme toggle updates label', async () => {
  const user = userEvent.setup();
  render(<App />);

  const themeBtn = screen.getByRole('button', { name: /toggle theme/i });
  expect(themeBtn).toHaveTextContent(/light|dark/i);

  const before = themeBtn.textContent;
  await user.click(themeBtn);
  expect(themeBtn.textContent).not.toEqual(before);
});
