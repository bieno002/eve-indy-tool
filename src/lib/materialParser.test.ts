import { describe, it, expect } from 'vitest';
import { parseMaterials } from './materialParser.js';

describe('parseMaterials', () => {
  describe('single line', () => {
    it('parses a comma-formatted quantity', () => {
      const { items, errors } = parseMaterials('Tritanium\t1,234,567');
      expect(errors).toHaveLength(0);
      expect(items).toEqual([{ name: 'Tritanium', quantity: 1_234_567 }]);
    });

    it('parses a plain integer quantity', () => {
      const { items, errors } = parseMaterials('Pyerite\t500');
      expect(errors).toHaveLength(0);
      expect(items).toEqual([{ name: 'Pyerite', quantity: 500 }]);
    });
  });

  describe('multiple lines', () => {
    it('returns one entry per unique item', () => {
      const input = 'Tritanium\t1,000\nPyerite\t500\nMexallon\t200';
      const { items, errors } = parseMaterials(input);
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(3);
      expect(items[0]).toEqual({ name: 'Tritanium', quantity: 1000 });
      expect(items[1]).toEqual({ name: 'Pyerite', quantity: 500 });
      expect(items[2]).toEqual({ name: 'Mexallon', quantity: 200 });
    });
  });

  describe('line endings', () => {
    it('handles \\r\\n (Windows) line endings', () => {
      const { items, errors } = parseMaterials('Tritanium\t100\r\nPyerite\t200');
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(2);
    });

    it('handles a trailing newline', () => {
      const { items, errors } = parseMaterials('Tritanium\t100\n');
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(1);
    });
  });

  describe('blank lines', () => {
    it('skips blank lines between items', () => {
      const input = 'Tritanium\t100\n\nPyerite\t200\n\n';
      const { items, errors } = parseMaterials(input);
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(2);
    });

    it('returns empty when input is only whitespace', () => {
      const { items, errors } = parseMaterials('   \n  \n');
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(0);
    });
  });

  describe('empty input', () => {
    it('returns empty arrays for an empty string', () => {
      const { items, errors } = parseMaterials('');
      expect(errors).toHaveLength(0);
      expect(items).toHaveLength(0);
    });
  });

  describe('deduplication', () => {
    it('sums quantities of duplicate names', () => {
      const input = 'Tritanium\t1,000\nTritanium\t500';
      const { items } = parseMaterials(input);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({ name: 'Tritanium', quantity: 1500 });
    });

    it('deduplicates case-insensitively, preserving first-seen casing', () => {
      const input = 'Tritanium\t1,000\ntritanium\t500\nTRITANIUM\t200';
      const { items } = parseMaterials(input);
      expect(items).toHaveLength(1);
      expect(items[0]).toEqual({ name: 'Tritanium', quantity: 1700 });
    });
  });

  describe('malformed lines', () => {
    it('reports an error for a line with no tab', () => {
      const input = 'Tritanium 1000\nPyerite\t200';
      const { items, errors } = parseMaterials(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].lineNumber).toBe(1);
      expect(errors[0].reason).toMatch(/two tab-separated columns/);
      expect(items).toEqual([{ name: 'Pyerite', quantity: 200 }]);
    });

    it('reports an error for a line with more than one tab', () => {
      const input = 'Name\tQty\textra';
      const { errors } = parseMaterials(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].lineNumber).toBe(1);
    });

    it('records the offending line text in the error', () => {
      const { errors } = parseMaterials('bad line here');
      expect(errors[0].line).toBe('bad line here');
    });
  });

  describe('invalid quantities', () => {
    it('reports an error for a zero quantity', () => {
      const { errors } = parseMaterials('Tritanium\t0');
      expect(errors).toHaveLength(1);
      expect(errors[0].reason).toMatch(/Invalid quantity/);
    });

    it('reports an error for a negative quantity', () => {
      const { errors } = parseMaterials('Tritanium\t-100');
      expect(errors).toHaveLength(1);
      expect(errors[0].reason).toMatch(/Invalid quantity/);
    });

    it('reports an error for a non-numeric quantity', () => {
      const { errors } = parseMaterials('Tritanium\tabc');
      expect(errors).toHaveLength(1);
      expect(errors[0].reason).toMatch(/Invalid quantity/);
    });
  });

  describe('quantity formatting', () => {
    it('strips apostrophe thousand separators', () => {
      const { items } = parseMaterials("Tritanium\t1'000'000");
      expect(items[0].quantity).toBe(1_000_000);
    });

    it('strips space thousand separators', () => {
      const { items } = parseMaterials('Tritanium\t1 000 000');
      expect(items[0].quantity).toBe(1_000_000);
    });
  });
});
