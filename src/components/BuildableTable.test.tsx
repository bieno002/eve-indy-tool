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

describe('BuildableTable', () => {
  it('shows empty state when no items', () => {
    render(<BuildableTable items={[]} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText(/No buildable items/)).toBeInTheDocument();
  });

  it('renders a row for each item', () => {
    const items = [makeItem(), makeItem({ blueprintTypeID: 101, productName: 'Shield Booster', possibleRuns: 1 })];
    render(<BuildableTable items={items} selectedId={null} onSelect={vi.fn()} />);
    expect(screen.getByText('Mining Laser')).toBeInTheDocument();
    expect(screen.getByText('Shield Booster')).toBeInTheDocument();
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
});
