export type Theme = 'dark' | 'light';

/** The document kinds this extension previews. */
export type DocumentKind = 'csv' | 'excel';

/** A cell as it arrives from the workbook reader. */
export type CellValue = string | number | boolean | null;

/** Grid layout the user arrived at, kept per document in workspace state. */
export interface ViewState {
  columnWidths?: Record<string, number>;
  sortColumn?: string;
  sortDir?: 'asc' | 'desc';
  scrollTop?: number;
  scrollLeft?: number;
}

export interface CsvConfig {
  separator: string;
  quoteMark: string;
  hasHeaders: boolean;
  lineNumbers: 'none' | 'ordinal' | 'source';
  formatValues: 'always' | 'never';
  numberFormat: string;
}

/** Host to webview: the parsed rows of a delimited file. */
export interface CsvDataMessage {
  type: 'data';
  kind: 'csv';
  rows: string[][];
  config: CsvConfig;
  state: ViewState;
  theme: Theme;
}

/** Host to webview: every sheet of a workbook, in tab order. */
export interface ExcelDataMessage {
  type: 'data';
  kind: 'excel';
  sheetNames: string[];
  sheets: Record<string, CellValue[][]>;
  showInfo: boolean;
  state: ViewState;
  theme: Theme;
}

/** Host to webview: the file could not be read. */
export interface ErrorMessage {
  type: 'error';
  message: string;
}

/** Webview to host: the page is listening. */
export interface ReadyMessage {
  type: 'ready';
}

/** Webview to host: the user resized, sorted or scrolled the grid. */
export interface SaveStateMessage {
  type: 'saveState';
  state: ViewState;
}

export type DataMessage = CsvDataMessage | ExcelDataMessage;
export type HostMessage = DataMessage | ErrorMessage;
export type WebviewMessage = ReadyMessage | SaveStateMessage;
