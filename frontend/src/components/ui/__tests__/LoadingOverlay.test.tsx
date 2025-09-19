import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoadingOverlay from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(<LoadingOverlay isVisible={false} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders with default props when visible', () => {
    render(<LoadingOverlay isVisible={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    // Check for the spinner element by its animation class
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay isVisible={true} message="Custom loading message" />);

    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders with backdrop by default', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByText('Loading...').closest('div')?.parentElement;
    expect(overlay).toHaveClass('bg-black', 'bg-opacity-50');
  });

  it('renders without backdrop when backdrop is false', () => {
    render(<LoadingOverlay isVisible={true} backdrop={false} />);

    const overlay = screen.getByText('Loading...').closest('div')?.parentElement;
    expect(overlay).not.toHaveClass('bg-black', 'bg-opacity-50');
  });

  it('has correct positioning classes', () => {
    render(<LoadingOverlay isVisible={true} />);

    const overlay = screen.getByText('Loading...').closest('div')?.parentElement;
    expect(overlay).toHaveClass(
      'fixed',
      'inset-0',
      'z-50',
      'flex',
      'items-center',
      'justify-center'
    );
  });

  it('has correct content styling', () => {
    render(<LoadingOverlay isVisible={true} />);

    const content = screen.getByText('Loading...').closest('div');
    expect(content).toHaveClass(
      'bg-white',
      'rounded-lg',
      'p-8',
      'shadow-xl',
      'flex',
      'flex-col',
      'items-center'
    );
  });

  it('has correct text styling', () => {
    render(<LoadingOverlay isVisible={true} />);

    const text = screen.getByText('Loading...');
    expect(text).toHaveClass('text-gray-700', 'font-medium');
  });
});
