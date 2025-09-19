import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Alert from '../Alert';

describe('Alert', () => {
  it('renders with default props', () => {
    render(<Alert>Test alert message</Alert>);

    const alert = screen.getByText('Test alert message');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveClass(
      'p-4',
      'rounded-full',
      'border-l-4',
      'bg-blue-50',
      'border-blue-400',
      'text-blue-800'
    );
  });

  it('renders with success variant', () => {
    render(<Alert variant="success">Success message</Alert>);

    const alert = screen.getByText('Success message');
    expect(alert).toHaveClass('bg-green-50', 'border-green-400', 'text-green-800');
  });

  it('renders with warning variant', () => {
    render(<Alert variant="warning">Warning message</Alert>);

    const alert = screen.getByText('Warning message');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-400', 'text-yellow-800');
  });

  it('renders with error variant', () => {
    render(<Alert variant="error">Error message</Alert>);

    const alert = screen.getByText('Error message');
    expect(alert).toHaveClass('bg-red-50', 'border-red-400', 'text-red-800');
  });

  it('renders with info variant', () => {
    render(<Alert variant="info">Info message</Alert>);

    const alert = screen.getByText('Info message');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-400', 'text-blue-800');
  });

  it('applies custom className', () => {
    render(<Alert className="custom-class">Custom alert</Alert>);

    const alert = screen.getByText('Custom alert');
    expect(alert).toHaveClass('custom-class');
  });

  it('renders complex children', () => {
    render(
      <Alert>
        <div>
          <h3>Alert Title</h3>
          <p>Alert description</p>
        </div>
      </Alert>
    );

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
    expect(screen.getByText('Alert description')).toBeInTheDocument();
  });
});
