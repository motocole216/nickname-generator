import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ResultsDisplay from './ResultsDisplay';

describe('ResultsDisplay', () => {
  const mockResults = ['Test Nickname 1', 'Test Nickname 2'];

  it('renders without crashing', () => {
    render(<ResultsDisplay results={mockResults} />);
    expect(screen.getByText(mockResults[0])).toBeInTheDocument();
  });

  it('displays empty state when no results are provided', () => {
    render(<ResultsDisplay results={[]} />);
    expect(screen.getByText(/Your Generated Nicknames/i)).toBeInTheDocument();
  });

  it('displays all provided nicknames', () => {
    render(<ResultsDisplay results={mockResults} />);
    mockResults.forEach(nickname => {
      expect(screen.getByText(nickname)).toBeInTheDocument();
    });
  });
}); 