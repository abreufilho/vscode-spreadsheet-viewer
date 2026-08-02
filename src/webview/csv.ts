import type { CsvConfig } from '../types';
import {
  clearTable,
  renderTable,
  setInfo,
  setStatus,
  start,
  textNode,
  type ColumnDefinition,
  type Row,
} from './grid';

const ROW_NUMBER_FIELD = '_rowNum';

/** Columns come from the widest row, so ragged files do not lose their tail. */
function columnCount(rows: string[][]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}

function headerTitles(header: string[], count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const title = header[index];
    return title !== undefined && title !== '' ? title : `Col ${index + 1}`;
  });
}

/** Renders numbers with the configured precision, and leaves text untouched. */
function formatValue(value: unknown, config: CsvConfig): string {
  if (value === null || value === undefined || value === '') return '';

  const text = String(value);
  const number = Number(text);
  if (text.trim() === '' || Number.isNaN(number)) return text;

  const digits = parseInt(config.numberFormat.replace(/\D/g, ''), 10);
  return number.toLocaleString(undefined, {
    maximumFractionDigits: Number.isNaN(digits) ? 2 : digits,
  });
}

function buildColumns(titles: string[], config: CsvConfig): ColumnDefinition[] {
  const columns: ColumnDefinition[] = [];

  if (config.lineNumbers !== 'none') {
    columns.push({
      title: '#',
      field: ROW_NUMBER_FIELD,
      frozen: true,
      headerSort: false,
      width: 60,
      cssClass: 'row-number',
    });
  }

  titles.forEach((title, index) => {
    columns.push({
      title,
      field: `col_${index}`,
      headerFilter: 'input',
      resizable: true,
      titleFormatter: () => textNode(title),
      formatter: (cell) =>
        textNode(
          config.formatValues === 'never'
            ? String(cell.getValue() ?? '')
            : formatValue(cell.getValue(), config)
        ),
    });
  });

  return columns;
}

function buildRows(dataRows: string[][], config: CsvConfig, firstLine: number): Row[] {
  return dataRows.map((cells, index) => {
    const row: Row = {};
    if (config.lineNumbers !== 'none') {
      row[ROW_NUMBER_FIELD] = config.lineNumbers === 'source' ? firstLine + index : index + 1;
    }
    cells.forEach((value, column) => {
      row[`col_${column}`] = value;
    });
    return row;
  });
}

start((message) => {
  if (message.kind !== 'csv') return;

  const { rows, config, state } = message;
  if (rows.length === 0) {
    clearTable();
    setInfo(null);
    setStatus('The file is empty.');
    return;
  }

  const hasHeaders = config.hasHeaders && rows.length > 1;
  const titles = headerTitles(hasHeaders ? (rows[0] ?? []) : [], columnCount(rows));
  const dataRows = hasHeaders ? rows.slice(1) : rows;

  renderTable(
    buildColumns(titles, config),
    buildRows(dataRows, config, hasHeaders ? 2 : 1),
    state
  );
  setInfo(`${dataRows.length} rows × ${titles.length} columns`);
});
