import * as crypto from 'node:crypto';
import * as vscode from 'vscode';
import * as XLSX from 'xlsx';
import { detectSeparator, parseCsv, resolveSeparator } from './lib/csv';
import { baseName } from './lib/document';
import type {
  CellValue,
  CsvConfig,
  DocumentKind,
  Theme,
  ViewState,
  WebviewMessage,
} from './types';

const KIND_LABELS: Record<DocumentKind, string> = { csv: 'delimited file', excel: 'workbook' };

function getNonce(): string {
  return crypto.randomBytes(16).toString('base64');
}

/**
 * A preview panel over one document. The panel is supplied by the custom editor
 * that opened it, so the extension never owns a second window for the same file.
 */
export class SpreadsheetDocumentView {
  private static readonly openViews = new Set<SpreadsheetDocumentView>();

  /** The preview the user is looking at, if a preview holds focus at all. */
  static active(): SpreadsheetDocumentView | undefined {
    for (const view of SpreadsheetDocumentView.openViews) {
      if (view.panel.active) return view;
    }
    return undefined;
  }

  private readonly disposables: vscode.Disposable[] = [];
  private readonly stateKey: string;
  private state: ViewState;

  constructor(
    private readonly uri: vscode.Uri,
    private readonly extensionUri: vscode.Uri,
    private readonly kind: DocumentKind,
    private readonly context: vscode.ExtensionContext,
    private readonly panel: vscode.WebviewPanel
  ) {
    this.stateKey = `view-state:${uri.toString()}`;
    this.state = context.workspaceState.get<ViewState>(this.stateKey) ?? {};

    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')],
    };

    this.panel.webview.onDidReceiveMessage(
      (message: WebviewMessage) => void this.onMessage(message),
      null,
      this.disposables
    );

    vscode.workspace.onDidChangeConfiguration(
      (event) => {
        if (event.affectsConfiguration('spreadsheetViewer', this.uri)) void this.refresh();
      },
      null,
      this.disposables
    );

    this.watchSource();
    this.panel.webview.html = this.getHtml();
    SpreadsheetDocumentView.openViews.add(this);
  }

  private async onMessage(message: WebviewMessage): Promise<void> {
    if (message.type === 'ready') {
      await this.refresh();
    } else if (message.type === 'saveState') {
      this.state = message.state;
      await this.context.workspaceState.update(this.stateKey, this.state);
    }
  }

  private watchSource(): void {
    if (this.uri.scheme !== 'file') return;

    const pattern = new vscode.RelativePattern(
      vscode.Uri.joinPath(this.uri, '..'),
      baseName(this.uri.path)
    );
    const watcher = vscode.workspace.createFileSystemWatcher(pattern);
    watcher.onDidChange(() => void this.refresh(), null, this.disposables);
    watcher.onDidDelete(() => this.panel.dispose(), null, this.disposables);
    this.disposables.push(watcher);
  }

  /** Drops the stored layout and redraws, so the grid returns to its defaults. */
  async clearState(): Promise<void> {
    this.state = {};
    await this.context.workspaceState.update(this.stateKey, undefined);
    await this.refresh();
  }

  async refresh(): Promise<void> {
    try {
      const payload =
        this.kind === 'csv' ? await this.readDelimited() : await this.readWorkbook();
      void this.panel.webview.postMessage({
        ...payload,
        state: this.state,
        theme: this.theme(),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      void this.panel.webview.postMessage({
        type: 'error',
        message: `Could not read ${baseName(this.uri.path)}: ${reason}`,
      });
    }
  }

  /**
   * Reads through the text document rather than the file, so a preview opened
   * beside an editor reflects edits that have not been saved yet.
   */
  private async readDelimited(): Promise<{
    type: 'data';
    kind: 'csv';
    rows: string[][];
    config: CsvConfig;
  }> {
    const document = await vscode.workspace.openTextDocument(this.uri);
    const text = document.getText();
    const config = this.csvConfig();
    const separator = config.separator === 'auto' ? detectSeparator(text) : config.separator;

    return {
      type: 'data',
      kind: 'csv',
      rows: parseCsv(text, separator, config.quoteMark),
      config: { ...config, separator },
    };
  }

  private csvConfig(): CsvConfig {
    const settings = vscode.workspace.getConfiguration('spreadsheetViewer.csv', this.uri);
    return {
      separator: resolveSeparator(settings.get('separator', 'auto')),
      quoteMark: settings.get('quoteMark', '"'),
      hasHeaders: settings.get('hasHeaders', true),
      lineNumbers: settings.get('lineNumbers', 'none'),
      formatValues: settings.get('formatValues', 'always'),
      numberFormat: settings.get('numberFormat', 'g2'),
    };
  }

  private async readWorkbook(): Promise<{
    type: 'data';
    kind: 'excel';
    sheetNames: string[];
    sheets: Record<string, CellValue[][]>;
    showInfo: boolean;
  }> {
    const bytes = await vscode.workspace.fs.readFile(this.uri);
    const workbook = XLSX.read(bytes, { type: 'array' });

    const sheets: Record<string, CellValue[][]> = {};
    for (const name of workbook.SheetNames) {
      const sheet = workbook.Sheets[name];
      sheets[name] = sheet
        ? XLSX.utils.sheet_to_json<CellValue[]>(sheet, { header: 1, defval: '' })
        : [];
    }

    return {
      type: 'data',
      kind: 'excel',
      sheetNames: workbook.SheetNames,
      sheets,
      showInfo: vscode.workspace
        .getConfiguration('spreadsheetViewer.excel', this.uri)
        .get('showInfo', true),
    };
  }

  private theme(): Theme {
    // HighContrast is the dark high-contrast theme; the light one is
    // HighContrastLight. There is no HighContrastDark member.
    const kind = vscode.window.activeColorTheme.kind;
    const dark =
      kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
    return dark ? 'dark' : 'light';
  }

  private webviewUri(...segments: string[]): string {
    return this.panel.webview
      .asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', ...segments))
      .toString();
  }

  private getHtml(): string {
    const nonce = getNonce();
    const source = this.panel.webview.cspSource;
    const csp = [
      "default-src 'none'",
      `script-src 'nonce-${nonce}'`,
      `style-src ${source} 'unsafe-inline'`,
      `img-src ${source} data:`,
      `font-src ${source}`,
    ].join('; ');

    const tabs = this.kind === 'excel' ? '\n  <div id="sheet-tabs"></div>' : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp};">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${this.webviewUri('vendor', 'tabulator.min.css')}">
  <link rel="stylesheet" href="${this.webviewUri('webview', 'styles.css')}">
</head>
<body>
  <div id="status">Loading ${KIND_LABELS[this.kind]}…</div>
  <div id="info-bar"></div>${tabs}
  <div id="grid"></div>
  <script nonce="${nonce}" src="${this.webviewUri('vendor', 'tabulator.min.js')}"></script>
  <script nonce="${nonce}" src="${this.webviewUri('webview', `${this.kind}.js`)}"></script>
</body>
</html>`;
  }

  dispose(): void {
    SpreadsheetDocumentView.openViews.delete(this);
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables.length = 0;
  }
}
