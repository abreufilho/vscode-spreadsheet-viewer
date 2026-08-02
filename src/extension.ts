import * as vscode from 'vscode';
import { kindForPath, selectTargetUri } from './lib/document';
import { SpreadsheetDocumentView } from './spreadsheetDocumentView';
import { SpreadsheetEditorProvider } from './spreadsheetEditor';

/** Opens the preview for whatever the command was invoked on. */
function openPreview(explicitUri: vscode.Uri | undefined): void {
  const activeTabInput = vscode.window.tabGroups.activeTabGroup.activeTab?.input as
    { uri?: vscode.Uri } | undefined;

  const uri = selectTargetUri(
    explicitUri,
    vscode.window.activeTextEditor?.document.uri,
    activeTabInput
  );
  if (!uri) return;

  const kind = kindForPath(uri.path);
  if (!kind) return;

  void vscode.commands.executeCommand(
    'vscode.openWith',
    uri,
    SpreadsheetEditorProvider.viewType(kind)
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    SpreadsheetEditorProvider.register(context, 'csv'),
    SpreadsheetEditorProvider.register(context, 'excel'),
    vscode.commands.registerCommand('spreadsheetViewer.open', (uri?: vscode.Uri) =>
      openPreview(uri)
    ),
    vscode.commands.registerCommand(
      'spreadsheetViewer.refresh',
      () => void SpreadsheetDocumentView.active()?.refresh()
    ),
    vscode.commands.registerCommand(
      'spreadsheetViewer.clearState',
      () => void SpreadsheetDocumentView.active()?.clearState()
    )
  );
}

export function deactivate(): void {}
