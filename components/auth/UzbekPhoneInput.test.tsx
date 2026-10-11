import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { UzbekPhoneInput } from './UzbekPhoneInput';

function Harness() {
  const [value, setValue] = useState('+998 ');
  return <UzbekPhoneInput aria-label="Phone" value={value} onValueChange={setValue} />;
}

describe('UzbekPhoneInput', () => {
  it('formats typing and pasted digits while preserving the prefix', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Phone' });
    fireEvent.change(input, { target: { value: '901234567' } });
    expect(input).toHaveValue('+998 90 123 45 67');
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue('+998 ');
  });

  it('does not delete inside the protected prefix', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Phone' }) as HTMLInputElement;
    input.setSelectionRange(4, 4);
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(input).toHaveValue('+998 ');
    expect(input.selectionStart).toBe(5);
  });

  it('rejects a pasted foreign country code without rewriting it as a false Uzbek number', () => {
    render(<Harness />);
    const input = screen.getByRole('textbox', { name: 'Phone' });

    fireEvent.change(input, { target: { value: '+998 90 123 45 67' } });
    expect(input).toHaveValue('+998 90 123 45 67');

    fireEvent.change(input, { target: { value: '+1 202 555 0147' } });

    expect(input).toHaveValue('+998 90 123 45 67');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Номера других стран не поддерживаются');

    fireEvent.change(input, { target: { value: '+998 91 234 56 78' } });

    expect(input).toHaveValue('+998 91 234 56 78');
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
