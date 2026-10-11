import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeProductShelf } from './HomeProductShelf';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

describe('HomeProductShelf', () => {
  it('keeps the collection heading and destination visible when there are no products', () => {
    render(<HomeProductShelf title="Скидки" href="/ru/catalog?sort=price_asc" products={[]} locale="ru" allLabel="Смотреть все" emptyLabel="В этой подборке пока нет товаров." />);

    expect(screen.getByRole('heading', { name: 'Скидки' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Смотреть все' })).toHaveAttribute('href', '/ru/catalog?sort=price_asc');
    expect(screen.getByRole('status')).toHaveTextContent('В этой подборке пока нет товаров.');
  });
});
