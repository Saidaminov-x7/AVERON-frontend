import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './Select';

function TestSelect({ onValueChange = vi.fn() }: { onValueChange?: (value: string) => void }) {
  return (
    <div>
      <Select defaultValue="ru" onValueChange={onValueChange}>
        <SelectTrigger aria-label="Language">
          <SelectValue placeholder="Choose a language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ru">Russian</SelectItem>
          <SelectItem value="uz">Uzbek</SelectItem>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="disabled" disabled>Disabled</SelectItem>
        </SelectContent>
      </Select>
      <button type="button">Outside</button>
    </div>
  );
}

describe('Select', () => {
  it('opens a labeled listbox, selects with the keyboard, and returns focus to the trigger', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TestSelect onValueChange={onValueChange} />);

    const trigger = screen.getByRole('combobox', { name: 'Language' });
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');
    options[0].focus();
    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(options[1]).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('uz');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Uzbek');
    expect(trigger).toHaveFocus();
  });

  it('closes on Escape and outside click, and does not select disabled options', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<TestSelect onValueChange={onValueChange} />);

    const trigger = screen.getByRole('combobox', { name: 'Language' });
    await user.click(trigger);
    fireEvent.keyDown(screen.getByRole('listbox'), { key: 'Escape' });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByRole('option', { name: 'Disabled' }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
