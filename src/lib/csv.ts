const SEPARATORS: Record<string, string> = {
  comma: ',',
  semicolon: ';',
  tab: '\t',
  pipe: '|',
};

/** Turns a setting value such as "semicolon" into the character it names. */
export function resolveSeparator(value: string): string {
  return SEPARATORS[value] ?? value;
}

/** Guesses the separator from the first line, by counting candidates. */
export function detectSeparator(text: string): string {
  const [line = ''] = text.split(/\r?\n/, 1);
  const counts: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  for (const character of line) {
    if (character in counts) {
      counts[character] = (counts[character] ?? 0) + 1;
    }
  }

  let best = ',';
  let maximum = 0;
  for (const [character, count] of Object.entries(counts)) {
    if (count > maximum) {
      best = character;
      maximum = count;
    }
  }
  return best;
}

/**
 * Parses delimited text into rows.
 *
 * Quoted fields may hold the separator and line breaks, and a doubled quote
 * inside a quoted field is a literal quote. Blank lines are dropped rather than
 * rendered as empty rows.
 */
export function parseCsv(text: string, separator: string, quote: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  const pushRow = (): void => {
    row.push(field);
    field = '';
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (quoted) {
      if (character === quote) {
        if (text[index + 1] === quote) {
          field += quote;
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === quote) {
      quoted = true;
    } else if (character === separator) {
      row.push(field);
      field = '';
    } else if (character === '\n' || (character === '\r' && text[index + 1] === '\n')) {
      if (character === '\r') index += 1;
      pushRow();
    } else {
      field += character;
    }
  }

  if (field || row.length > 0) {
    pushRow();
  }

  return rows;
}
