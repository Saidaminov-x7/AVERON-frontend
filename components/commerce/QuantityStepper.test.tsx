import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { QuantityStepper } from './QuantityStepper';

describe('QuantityStepper', () => {
  it('provides labeled controls and enforces the supplied stock limit', () => {
    const onChange = vi.fn();
    render(
      <QuantityStepper
        label="Quantity"
        value={2}
        min={1}
        max={2}
        onChange={onChange}
        decreaseLabel="Quantity: 2, decrease"
        increaseLabel="Quantity: 2, increase"
      />,
    );

    expect(screen.getByRole('group', { name: 'Quantity' })).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity: 2')).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Quantity: 2, increase' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Quantity: 2, decrease' }));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('keeps both controls disabled when the stepper is disabled', () => {
    render(
      <QuantityStepper
        label="Quantity"
        value={1}
        disabled
        onChange={vi.fn()}
        decreaseLabel="Decrease"
        increaseLabel="Increase"
      />,
    );

    expect(screen.getByRole('button', { name: 'Decrease' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase' })).toBeDisabled();
  });
});
