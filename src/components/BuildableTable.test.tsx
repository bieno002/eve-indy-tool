import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BuildableTable } from './BuildableTable.js';
import type { BuildableItem } from '../types/models.js';

const makeItem = (overrides: Partial<BuildableItem> = {}): BuildableItem => ({
  blueprintTypeID: 100,
  productTypeID: 200,
  productName: 'Mining Laser',
  possibleRuns: 3,
  perRunRequirements: [
    { materialTypeID: 1, materialName: 'Tritanium', requiredPerRun: 100, have: 500 },
  ],
  bottleneckMaterialTypeID: 1,
  bottleneckMaterialName: 'Tritanium',
  shortfalls: [],
  ...overrides,
});

const twoItems = [
  makeItem({ blueprintTypeID: 100, productName: 'Mining Laser', possibleRuns: 3 }),
  makeItem({ blueprintTypeID: 101, productName: 'Afterburner', possibleRuns: 5 }),
];

describe('BuildableTable', () => {
  it('shows empty state when no items', () => {
    render(<BuildableTable items={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/No buildable items/)).toBeInTheDocument();
  });

  it('shows loading skeleton when isLoading', () => {
    render(<BuildableTable items={[]} selectedId={null} onSelect={vi.fn()} isLoading />);
    expect(screen.getByLabelText('Loading results')).toBeInTheDocument();
    expect(screen.queryByText(/No buildable items/)).not.toBeInTheDocument();
  });

  it('renders a row for each item', () => {
    render(<BuildableTable items={twoItems} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Mining Laser')).toBeInTheDocument();
    expect(screen.getByText('Afterburner')).toBeInTheDocument();
  });

  it('shows possible runs count', () => {
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows bottleneck material name', () => {
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Tritanium')).toBeInTheDocument();
  });

  it('shows dash when no bottleneck', () => {
    const item = makeItem({ bottleneckMaterialTypeID: null, bottleneckMaterialName: null });
    render(<BuildableTable items={[item]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onSelect with item when row clicked', () => {
    const onSelect = vi.fn();
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Mining Laser'));
    expect(onSelect).toHaveBeenCalledWith(makeItem());
  });

  it('calls onSelect with null when selected row clicked again', () => {
    const onSelect = vi.fn();
    render(<BuildableTable items={[makeItem()]} selectedId={100} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Mining Laser'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('calls onSelect when Enter pressed on a row', () => {
    const onSelect = vi.fn();
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByText('Mining Laser').closest('tr')!, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(makeItem());
  });

  it('calls onSelect when Space pressed on a row', () => {
    const onSelect = vi.fn();
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByText('Mining Laser').closest('tr')!, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(makeItem());
  });

  it('does not call onSelect for other keys', () => {
    const onSelect = vi.fn();
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={onSelect} />);
    fireEvent.keyDown(screen.getByText('Mining Laser').closest('tr')!, { key: 'Tab' });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('shows default sort indicator on Possible Runs column', () => {
    render(<BuildableTable items={[makeItem()]} selectedId={null} onSelect={vi.fn()} />);
    const runsHeader = screen.getByRole('columnheader', { name: /Runs/ });
    expect(runsHeader.textContent).toContain('↓');
  });

  it('clicking Product header sorts ascending by name', () => {
    render(<BuildableTable items={twoItems} selectedId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /Product/ }));
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Afterburner');
    expect(rows[1]).toHaveTextContent('Mining Laser');
  });

  it('clicking active sort header toggles direction', () => {
    render(<BuildableTable items={twoItems} selectedId={null} onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('columnheader', { name: /Runs/ }));
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows[0]).toHaveTextContent('Mining Laser');
    expect(rows[1]).toHaveTextContent('Afterburner');
  });

  it('filter input hides non-matching rows', () => {
    render(<BuildableTable items={twoItems} selectedId={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Filter by product name'), {
      target: { value: 'after' },
    });
    expect(screen.getByText('Afterburner')).toBeInTheDocument();
    expect(screen.queryByText('Mining Laser')).not.toBeInTheDocument();
  });

  it('shows empty filter state when no items match', () => {
    render(<BuildableTable items={twoItems} selectedId={null} onSelect={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Filter by product name'), {
      target: { value: 'zzznothing' },
    });
    expect(screen.getByText(/No items match/)).toBeInTheDocument();
  });
});
