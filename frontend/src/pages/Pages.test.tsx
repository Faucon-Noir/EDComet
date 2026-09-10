import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Pages from './Pages';

vi.mock('../components/header/Header', () => ({
  Header: () => <header>Application header</header>,
}));

vi.mock('./Home', () => ({
  default: () => <main>Home page</main>,
}));

vi.mock('./Construction', () => ({
  default: () => <main>Construction page</main>,
}));

vi.mock('./Ship', () => ({
  default: () => <main>Ship page</main>,
}));

describe('Pages', () => {
  it.each([
    ['/', 'Home page'],
    ['/construction', 'Construction page'],
    ['/ship', 'Ship page'],
  ])('renders %s at its configured route', (path, pageName) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Pages />
      </MemoryRouter>,
    );

    expect(screen.getByRole('main', { name: '' })).toHaveTextContent(pageName);
    expect(screen.getByText('Application header')).toBeInTheDocument();
  });

  it('renders the not-found page for an unknown route', () => {
    render(
      <MemoryRouter initialEntries={['/unknown']}>
        <Pages />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });
});