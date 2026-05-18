import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShortfallList } from './ShortfallList.js';
import type { BuildableItem } from '../types/models.js';

const baseItem: BuildableItem = {
  blueprintTypeID: 1,
  productTypeID: 2,
  productName: 'Mining Laser',
  possibleRuns: 5,
  perRunRequirements: [],
  bottleneckMaterialTypeID: null,
  bottleneckMaterialName: null,
  shortfalls: [],
};

describe('ShortfallList', () => {
  it('shows prompt when no item selected', () => {
    render(<ShortfallList item={null} />);
    expect(screen.getByText(/Select a row/)).toBeInTheDocument();
  });

  it('shows no-shortfall message when shortfalls is empty', () => {
    render(<ShortfallList item={baseItem} />);
    expect(screen.getByText(/No shortfalls/)).toBeInTheDocument();
  });

  it('shows product name and next run number in heading', () => {
    const item: BuildableItem = {
      ...baseItem,
      shortfalls: [{ materialTypeID: 1, materialName: 'Tritanium', needForOneMore: 500 }],
    };
    render(<ShortfallList item={item} />);
    expect(screen.getByText(/Mining Laser/)).toBeInTheDocument();
    expect(screen.getByText(/run 6/)).toBeInTheDocument();
  });

  it('lists each shortfall material', () => {
    const item: BuildableItem = {
      ...baseItem,
      shortfalls: [
        { materialTypeID: 1, materialName: 'Tritanium', needForOneMore: 500 },
        { materialTypeID: 2, materialName: 'Pyerite', needForOneMore: 250 },
      ],
    };
    render(<ShortfallList item={item} />);
    expect(screen.getByText('Tritanium')).toBeInTheDocument();
    expect(screen.getByText('Pyerite')).toBeInTheDocument();
  });

  it('formats needForOneMore with toLocaleString', () => {
    const item: BuildableItem = {
      ...baseItem,
      shortfalls: [{ materialTypeID: 1, materialName: 'Tritanium', needForOneMore: 1500 }],
    };
    render(<ShortfallList item={item} />);
    expect(screen.getByText(/need.*more/)).toBeInTheDocument();
  });
});
