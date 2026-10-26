import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './SearchInput';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

describe('SearchInput', () => {
  beforeEach(() => push.mockReset());

  it('clears a non-empty query using the localized square control and restores focus', async () => {
    const user = userEvent.setup();
    render(<SearchInput locale="ru" placeholder="Поиск по товарам" />);
    const input = screen.getByRole('textbox', { name: 'Поиск по товарам' });

    await user.type(input, 'куртка');
    const clear = screen.getByRole('button', { name: 'Очистить поиск' });
    await user.click(clear);

    expect(input).toHaveValue('');
    expect(input).toHaveFocus();
    expect(screen.queryByRole('button', { name: 'Очистить поиск' })).not.toBeInTheDocument();
  });

  it('submits a trimmed query in the selected locale', () => {
    render(<SearchInput locale="uz" />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '  kurtka  ' } });
    fireEvent.submit(input.closest('form')!);
    expect(push).toHaveBeenCalledWith('/uz/catalog?q=kurtka');
  });
});
