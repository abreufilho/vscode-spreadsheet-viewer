import type { CellValue, ExcelDataMessage } from '../types';
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

function columnCount(rows: CellValue[][]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.length), 0);
}

function buildColumns(header: CellValue[], count: number): ColumnDefinition[] {
  return Array.from({ length: count }, (_, index) => {
    const value = header[index];
    const title =
      value === undefined || value === null || value === ''
        ? `Col ${index + 1}`
        : String(value);
    return {
      title,
      field: `col_${index}`,
      headerFilter: 'input' as const,
      resizable: true,
      titleFormatter: () => textNode(title),
      formatter: (cell) => textNode(String(cell.getValue() ?? '')),
    };
  });
}

function buildRows(dataRows: CellValue[][]): Row[] {
  return dataRows.map((cells) => {
    const row: Row = {};
    cells.forEach((value, column) => {
      row[`col_${column}`] = value === null ? '' : String(value);
    });
    return row;
  });
}

function renderSheet(message: ExcelDataMessage, name: string): void {
  const rows = message.sheets[name] ?? [];
  if (rows.length === 0) {
    clearTable();
    setInfo(message.showInfo ? `${name}: empty` : null);
    return;
  }

  const count = columnCount(rows);
  renderTable(buildColumns(rows[0] ?? [], count), buildRows(rows.slice(1)), message.state);
  setInfo(message.showInfo ? `${name}: ${rows.length - 1} rows × ${count} columns` : null);
}

function buildSheetTabs(message: ExcelDataMessage, container: HTMLElement): void {
  const tabs = message.sheetNames.map((name, index) => {
    const tab = document.createElement('button');
    tab.className = index === 0 ? 'sheet-tab active' : 'sheet-tab';
    tab.textContent = name;
    tab.addEventListener('click', () => {
      for (const other of tabs) other.classList.remove('active');
      tab.classList.add('active');
      renderSheet(message, name);
    });
    return tab;
  });

  container.replaceChildren(...tabs);
}

start((message) => {
  if (message.kind !== 'excel') return;

  const tabs = document.getElementById('sheet-tabs');
  if (!tabs) {
    throw new Error('missing element: sheet-tabs');
  }

  const [first] = message.sheetNames;
  if (first === undefined) {
    tabs.replaceChildren();
    clearTable();
    setInfo(null);
    setStatus('The workbook has no sheets.');
    return;
  }

  buildSheetTabs(message, tabs);
  renderSheet(message, first);
});
