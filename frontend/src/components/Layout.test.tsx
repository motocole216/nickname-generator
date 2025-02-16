import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import Layout from './Layout';

describe('Layout', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('renders without crashing', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText(/Nickname Generator/i)).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Generate/i)).toBeInTheDocument();
  });

  it('renders links with correct hrefs', () => {
    renderWithRouter(<Layout />);
    expect(screen.getByText(/Home/i).closest('a')).toHaveAttribute('href', '/');
    expect(screen.getByText(/Generate/i).closest('a')).toHaveAttribute('href', '/generate');
  });
}); 