import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ImageUpload from './ImageUpload';

describe('ImageUpload', () => {
  const mockOnUpload = jest.fn();
  const defaultProps = {
    onUpload: mockOnUpload,
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<ImageUpload {...defaultProps} />);
    expect(screen.getByText(/Upload Image/i)).toBeInTheDocument();
  });

  it('handles file selection', () => {
    render(<ImageUpload {...defaultProps} />);
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const input = screen.getByLabelText(/upload image/i);
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.change(input);
    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('displays error for invalid file type', () => {
    render(<ImageUpload {...defaultProps} />);
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByLabelText(/upload image/i);
    
    Object.defineProperty(input, 'files', {
      value: [file]
    });

    fireEvent.change(input);
    expect(screen.getByText(/Please upload an image file/i)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ImageUpload {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Uploading.../i)).toBeInTheDocument();
  });
}); 