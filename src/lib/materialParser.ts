export type ParsedMaterial = {
  name: string;
  quantity: number;
};

export type ParseError = {
  lineNumber: number;
  line: string;
  reason: string;
};

export type ParseResult = {
  items: ParsedMaterial[];
  errors: ParseError[];
};

export function parseMaterials(input: string): ParseResult {
  const lines = input.split('\n');
  const items: ParsedMaterial[] = [];
  const errors: ParseError[] = [];
  const seen = new Map<string, number>(); // lowercase name → index in items

  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const line = lines[i].replace(/\r$/, '').trim();

    if (line === '') continue;

    const parts = line.split('\t');
    if (parts.length !== 2) {
      errors.push({ lineNumber, line, reason: 'Expected two tab-separated columns (name and quantity)' });
      continue;
    }

    const name = parts[0].trim();
    if (!name) {
      errors.push({ lineNumber, line, reason: 'Item name is empty' });
      continue;
    }

    const cleanQty = parts[1].replace(/[,\s']/g, '');
    const quantity = Number.parseInt(cleanQty, 10);

    if (Number.isNaN(quantity) || quantity <= 0) {
      errors.push({ lineNumber, line, reason: `Invalid quantity: "${parts[1].trim()}"` });
      continue;
    }

    const key = name.toLowerCase();
    const existing = seen.get(key);
    if (existing !== undefined) {
      items[existing].quantity += quantity;
    } else {
      seen.set(key, items.length);
      items.push({ name, quantity });
    }
  }

  return { items, errors };
}
