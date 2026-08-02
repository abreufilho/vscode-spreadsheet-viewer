import * as vscode from 'vscode';
import { SpreadsheetDocumentView } from './spreadsheetDocumentView';
import type { DocumentKind } from './types';

export class SpreadsheetEditorProvider implements vscode.CustomReadonlyEditorProvider {
  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly kind: DocumentKind
  ) {}

  openCustomDocument(uri: vscode.Uri): vscode.CustomDocument {
    return { uri, dispose: () => undefined };
  }

  resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): void {
    const view = new SpreadsheetDocumentView(
      document.uri,
      this.context.extensionUri,
      this.kind,
      this.context,
      webviewPanel
    );
    webviewPanel.onDidDispose(() => view.dispose());
  }

  static viewType(kind: DocumentKind): string {
    return `spreadsheet-viewer.${kind}Editor`;
  }

  static register(context: vscode.ExtensionContext, kind: DocumentKind): vscode.Disposable {
    return vscode.window.registerCustomEditorProvider(
      SpreadsheetEditorProvider.viewType(kind),
      new SpreadsheetEditorProvider(context, kind),
      { webviewOptions: { retainContextWhenHidden: true } }
    );
  }
}
