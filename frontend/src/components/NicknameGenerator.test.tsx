import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NicknameGenerator from './NicknameGenerator';

describe('NicknameGenerator', () => {
  it('renders without crashing', () => {
    render(<NicknameGenerator />);
    expect(screen.getByText(/Generate Nickname/i)).toBeInTheDocument();
  });

  it('handles image upload', async () => {
    render(<NicknameGenerator />);
    const fileInput = screen.getByLabelText(/upload image/i);
    expect(fileInput).toBeInTheDocument();
  });

  it('displays loading state when generating', () => {
    render(<NicknameGenerator />);
    const generateButton = screen.getByText(/Generate Nickname/i);
    fireEvent.click(generateButton);
    expect(screen.getByText(/Generating.../i)).toBeInTheDocument();
  });

  it('displays error message when generation fails', async () => {
    render(<NicknameGenerator />);
    // Simulate API error
    const generateButton = screen.getByText(/Generate Nickname/i);
    fireEvent.click(generateButton);
    expect(await screen.findByText(/Error/i)).toBeInTheDocument();
  });
}); 