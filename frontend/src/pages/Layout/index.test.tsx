import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Layout from '.';

vi.mock('../../components/header/Header', () => ({
  Header: () => <header>Application header</header>,
}));

describe('Layout', () => {
  it('renders the header and nested page content', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<main>Nested page content</main>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Application header')).toBeInTheDocument();
    expect(screen.getByText('Nested page content')).toBeInTheDocument();
  });
});