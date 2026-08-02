import type { DataMessage, HostMessage, Theme, ViewState, WebviewMessage } from '../types';

interface VsCodeApi {
  postMessage(message: WebviewMessage): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

/*
 * The slice of Tabulator this extension uses. The package ships no type
 * declarations, and the webview loads the prebuilt browser bundle from a script
 * tag, so the surface is declared here rather than imported.
 */

interface ColumnComponent {
  getField(): string;
  getWidth(): number;
}

interface CellComponent {
  getValue(): unknown;
}

interface Sorter {
  field: string;
  dir: 'asc' | 'desc';
}

export interface ColumnDefinition {
  title: string;
  field: string;
  headerFilter?: 'input';
  headerSort?: boolean;
  frozen?: boolean;
  resizable?: boolean;
  width?: number;
  cssClass?: string;
  titleFormatter?: (cell: CellComponent) => Node;
  formatter?: (cell: CellComponent) => Node;
}

export type Row = Record<string, string | number>;

interface TabulatorOptions {
  data: Row[];
  columns: ColumnDefinition[];
  layout: 'fitDataStretch';
  movableColumns: boolean;
  resizableRows: boolean;
  placeholder: string;
  initialSort: { column: string; dir: 'asc' | 'desc' }[];
}

interface TabulatorTable {
  destroy(): void;
  on(event: 'columnResized' | 'dataSorted' | 'tableBuilt', handler: () => void): void;
  getColumns(): ColumnComponent[];
  getSorters(): Sorter[];
}

declare const Tabulator: new (selector: string, options: TabulatorOptions) => TabulatorTable;

const ROW_NUMBER_FIELD = '_rowNum';

const vscode = acquireVsCodeApi();
let table: TabulatorTable | null = null;

function requireElement(id: string): HTMLElement {
  const found = document.getElementById(id);
  if (!found) {
    throw new Error(`missing element: ${id}`);
  }
  return found;
}

/**
 * Carries a value as text rather than as a string return. Tabulator assigns
 * string returns to innerHTML, so a cell holding markup would be parsed as
 * markup; a node carries the value and nothing else.
 */
export function textNode(value: string): Node {
  const span = document.createElement('span');
  span.textContent = value;
  return span;
}

export function setStatus(text: string): void {
  const status = requireElement('status');
  status.textContent = text;
  status.style.display = text ? 'block' : 'none';
}

export function setInfo(text: string | null): void {
  const bar = requireElement('info-bar');
  bar.textContent = text ?? '';
  bar.style.display = text ? 'block' : 'none';
}

function applyTheme(theme: Theme): void {
  document.body.classList.toggle('theme-dark', theme === 'dark');
  document.body.classList.toggle('theme-light', theme !== 'dark');
}

function scrollHolder(): HTMLElement | null {
  return document.querySelector('.tabulator-tableholder');
}

function saveState(): void {
  if (!table) return;

  const columnWidths: Record<string, number> = {};
  for (const column of table.getColumns()) {
    const field = column.getField();
    if (field && field !== ROW_NUMBER_FIELD) {
      columnWidths[field] = column.getWidth();
    }
  }

  const [sorter] = table.getSorters();
  const holder = scrollHolder();

  vscode.postMessage({
    type: 'saveState',
    state: {
      columnWidths,
      ...(sorter ? { sortColumn: sorter.field, sortDir: sorter.dir } : {}),
      scrollTop: holder?.scrollTop ?? 0,
      scrollLeft: holder?.scrollLeft ?? 0,
    },
  });
}

/** Replaces the grid, restoring the widths, sort and scroll the state carries. */
export function renderTable(columns: ColumnDefinition[], data: Row[], state: ViewState): void {
  const widths = state.columnWidths ?? {};
  const sized = columns.map((column) => {
    const width = widths[column.field];
    return width === undefined ? column : { ...column, width };
  });

  table?.destroy();
  table = new Tabulator('#grid', {
    data,
    columns: sized,
    layout: 'fitDataStretch',
    movableColumns: true,
    resizableRows: false,
    placeholder: 'No data',
    initialSort: state.sortColumn
      ? [{ column: state.sortColumn, dir: state.sortDir ?? 'asc' }]
      : [],
  });

  table.on('columnResized', saveState);
  table.on('dataSorted', saveState);
  table.on('tableBuilt', () => {
    const holder = scrollHolder();
    if (!holder) return;
    holder.scrollTop = state.scrollTop ?? 0;
    holder.scrollLeft = state.scrollLeft ?? 0;
  });
}

export function clearTable(): void {
  table?.destroy();
  table = null;
  requireElement('grid').replaceChildren();
}

/** Wires the webview to the host, reporting failures as status text. */
export function start(render: (message: DataMessage) => void): void {
  window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
    const message = event.data;
    if (!message) return;

    if (message.type === 'error') {
      setStatus(message.message);
      setInfo(null);
      clearTable();
      return;
    }

    if (message.type !== 'data') return;

    applyTheme(message.theme);
    try {
      render(message);
      setStatus('');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      setStatus(`Render failed: ${reason}`);
    }
  });

  window.addEventListener('load', () => vscode.postMessage({ type: 'ready' }));
}
