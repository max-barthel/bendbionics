import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Badge from '../Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>);

    const badge = screen.getByText('Default Badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass(
      'inline-flex',
      'items-center',
      'font-medium',
      'rounded-full',
      'bg-blue-100',
      'text-blue-800',
      'px-2',
      'py-1',
      'text-sm'
    );
  });

  it('renders with primary variant', () => {
    render(<Badge variant="primary">Primary Badge</Badge>);

    const badge = screen.getByText('Primary Badge');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary Badge</Badge>);

    const badge = screen.getByText('Secondary Badge');
    expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-800');
  });

  it('renders with success variant', () => {
    render(<Badge variant="success">Success Badge</Badge>);

    const badge = screen.getByText('Success Badge');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders with warning variant', () => {
    render(<Badge variant="warning">Warning Badge</Badge>);

    const badge = screen.getByText('Warning Badge');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  it('renders with error variant', () => {
    render(<Badge variant="error">Error Badge</Badge>);

    const badge = screen.getByText('Error Badge');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders with info variant', () => {
    render(<Badge variant="info">Info Badge</Badge>);

    const badge = screen.getByText('Info Badge');
    expect(badge).toHaveClass('bg-blue-50', 'text-blue-600');
  });

  it('renders with small size', () => {
    render(<Badge size="sm">Small Badge</Badge>);

    const badge = screen.getByText('Small Badge');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('renders with medium size', () => {
    render(<Badge size="md">Medium Badge</Badge>);

    const badge = screen.getByText('Medium Badge');
    expect(badge).toHaveClass('px-2', 'py-1', 'text-sm');
  });

  it('renders with large size', () => {
    render(<Badge size="lg">Large Badge</Badge>);

    const badge = screen.getByText('Large Badge');
    expect(badge).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom Badge</Badge>);

    const badge = screen.getByText('Custom Badge');
    expect(badge).toHaveClass('custom-class');
  });

  it('renders as span element', () => {
    render(<Badge>Span Badge</Badge>);

    const badge = screen.getByText('Span Badge');
    expect(badge.tagName).toBe('SPAN');
  });

  it('renders complex children', () => {
    render(
      <Badge>
        <span>Icon</span>
        <span>Text</span>
      </Badge>
    );

    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });
});
