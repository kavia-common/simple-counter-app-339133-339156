import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

test('renders the counter with initial value 0', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /counter/i })).toBeInTheDocument();
  expect(screen.getByTestId('count-value')).toHaveTextContent('0');
});

test('increment, decrement, and reset buttons update the count', async () => {
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
