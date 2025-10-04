import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SliderInput from '../SliderInput';

describe('SliderInput', () => {
  const defaultProps = {
    value: 50,
    onChange: vi.fn(),
    label: 'Test Slider',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    render(<SliderInput {...defaultProps} />);

    expect(screen.getByText('Test Slider')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveValue('50');
    expect(screen.getByRole('textbox')).toHaveValue('50');
  });

  it('renders without label', () => {
    render(<SliderInput value={50} min={0} max={100} onChange={vi.fn()} />);

    expect(screen.queryByText('Test Slider')).not.toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('displays min and max range', () => {
    render(<SliderInput {...defaultProps} min={10} max={100} />);

    expect(screen.getByText('10 - 100')).toBeInTheDocument();
  });

  it('calls onChange when slider value changes', () => {
    render(<SliderInput {...defaultProps} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '75' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(75);
  });

  it('calls onChange when input value changes', () => {
    render(<SliderInput {...defaultProps} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: '80' } });

    expect(defaultProps.onChange).toHaveBeenCalledWith(80);
  });

  it('allows input values without clamping', () => {
    render(<SliderInput {...defaultProps} min={0} max={100} />);

    const input = screen.getByRole('textbox');

    // Test value below min - should pass through without clamping
    fireEvent.change(input, { target: { value: '-10' } });
    fireEvent.blur(input);

    expect(defaultProps.onChange).toHaveBeenCalledWith(-10);

    // Test value above max - should pass through without clamping
    fireEvent.change(input, { target: { value: '150' } });
    fireEvent.blur(input);

    expect(defaultProps.onChange).toHaveBeenCalledWith(150);
  });

  it('handles disabled state', () => {
    render(<SliderInput {...defaultProps} disabled={true} />);

    const slider = screen.getByRole('slider');
    const input = screen.getByRole('textbox');

    expect(slider).toBeDisabled();
    expect(input).toBeDisabled();
  });

  it('syncs input value when external value changes', async () => {
    const { rerender } = render(<SliderInput {...defaultProps} />);

    expect(screen.getByRole('textbox')).toHaveValue('50');

    rerender(<SliderInput {...defaultProps} value={75} />);

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toHaveValue('75');
    });
  });

  it('handles step increments correctly', () => {
    render(<SliderInput {...defaultProps} step={5} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '55' } });

    // The component should call onChange with the new value
    expect(defaultProps.onChange).toHaveBeenCalledWith(55);
  });

  it('generates unique IDs for accessibility', () => {
    render(<SliderInput {...defaultProps} />);

    const slider = screen.getByRole('slider');
    const input = screen.getByRole('textbox');

    expect(slider).toHaveAttribute('id');
    expect(slider.getAttribute('id')).toMatch(/^slider-/);
    expect(input).toBeInTheDocument();
  });
});
