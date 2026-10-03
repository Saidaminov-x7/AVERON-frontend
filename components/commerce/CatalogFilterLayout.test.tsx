import { fireEvent, render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import messages from '@/messages/ru.json';
import { CatalogFilterLayout } from './CatalogFilterLayout';

const refresh = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh }),
}));

function renderLayout() {
  return render(
    <NextIntlClientProvider locale="ru" messages={messages}>
      <CatalogFilterLayout filters={<div>Desktop filters</div>} mobileFilters={<div>Mobile filters</div>} resultCount={5}>
        <div>Products</div>
      </CatalogFilterLayout>
    </NextIntlClientProvider>,
  );
}

describe('CatalogFilterLayout', () => {
  beforeEach(() => refresh.mockReset());

  it('refreshes server results after browser back or forward navigation', async () => {
    renderLayout();

    fireEvent(window, new PopStateEvent('popstate'));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it('keeps the filter panel toggle immediate and accessible', () => {
    renderLayout();
    const toggle = screen.getByRole('button', { name: 'Скрыть фильтры' });

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Показать фильтры' })).toBeInTheDocument();
  });
});
