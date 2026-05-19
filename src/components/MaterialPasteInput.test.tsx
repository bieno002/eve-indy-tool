import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MaterialPasteInput } from './MaterialPasteInput.js';
import type { ParseErrorData } from '../types/models.js';

const noErrors: ParseErrorData[] = [];

describe('MaterialPasteInput', () => {
  it('renders a textarea', () => {
    render(<MaterialPasteInput value="" onChange={vi.fn()} errors={noErrors} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('has accessible label on textarea', () => {
    render(<MaterialPasteInput value="" onChange={vi.fn()} errors={noErrors} />);
    expect(screen.getByLabelText('Inventory paste area')).toBeInTheDocument();
  });

  it('calls onChange with new value', () => {
    const onChange = vi.fn();
    render(<MaterialPasteInput value="" onChange={onChange} errors={noErrors} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Tritanium\t1000' } });
    expect(onChange).toHaveBeenCalledWith('Tritanium\t1000');
  });

  it('shows no error list when errors is empty', () => {
    render(<MaterialPasteInput value="" onChange={vi.fn()} errors={noErrors} />);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders parse errors', () => {
    const errors: ParseErrorData[] = [
      { lineNumber: 2, line: 'bad line', reason: 'Expected two tab-separated columns' },
    ];
    render(<MaterialPasteInput value="" onChange={vi.fn()} errors={errors} />);
    expect(screen.getByText(/Line 2/)).toBeInTheDocument();
    expect(screen.getByText(/Expected two tab-separated columns/)).toBeInTheDocument();
  });

  it('renders multiple errors', () => {
    const errors: ParseErrorData[] = [
      { lineNumber: 1, line: 'a', reason: 'first error' },
      { lineNumber: 3, line: 'b', reason: 'second error' },
    ];
    render(<MaterialPasteInput value="" onChange={vi.fn()} errors={errors} />);
    expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    expect(screen.getByText(/Line 3/)).toBeInTheDocument();
  });
});
