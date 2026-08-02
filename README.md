# Spreadsheet Viewer

[![CI](https://github.com/abreufilho/vscode-spreadsheet-viewer/actions/workflows/ci.yml/badge.svg)](https://github.com/abreufilho/vscode-spreadsheet-viewer/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/abreufilho/vscode-spreadsheet-viewer?color=blue)](https://github.com/abreufilho/vscode-spreadsheet-viewer/releases/latest)
[![License](https://img.shields.io/github/license/abreufilho/vscode-spreadsheet-viewer?color=blue)](LICENSE)

Read `.csv`, `.tsv`, `.tab`, `.xlsx` and `.xlsm` files as a grid inside VS Code,
with sortable columns, per-column filters and one tab per worksheet.

Reading and rendering happen locally. The grid ships inside the extension, so no
file is uploaded and no network request is made.

## Requirements

VS Code 1.80 or later.

## Installation

Download the `.vsix` from the [latest release](https://github.com/abreufilho/vscode-spreadsheet-viewer/releases/latest)
and install it:

```bash
code --install-extension spreadsheet-viewer-<version>.vsix
```

## Usage

Open a workbook from the Explorer and VS Code routes it to the preview. Delimited
files open as text by default; use **Spreadsheet: Open Preview**, the
<kbd>Shift</kbd>+<kbd>Ctrl</kbd>+<kbd>V</kbd> shortcut, or **Reopen Editor With…**
to see them as a grid.

Column widths, the sort order and the scroll position survive reopening. Run
**Spreadsheet: Reset Preview Layout** to go back to the defaults.

## Features

- Sorts by any column and filters each one from its header.
- Reads the separator from the file, or takes the one you configure.
- Handles quoted fields holding separators and line breaks.
- Shows one tab per worksheet in a workbook.
- Remembers column widths, sorting and scroll position per file.
- Reloads when the file changes on disk, and follows the editor theme.

## Commands

| Command                              | Availability                                |
| ------------------------------------ | ------------------------------------------- |
| `Spreadsheet: Open Preview`          | `.csv` `.tsv` `.tab` `.xlsx` `.xlsm` files  |
| `Spreadsheet: Refresh Preview`       | An open preview                             |
| `Spreadsheet: Reset Preview Layout`  | An open preview                             |

## Settings

| Setting                                | Default  | Effect                                                                    |
| -------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `spreadsheetViewer.csv.separator`      | `auto`   | `comma`, `semicolon`, `tab`, `pipe`, a literal character, or `auto`        |
| `spreadsheetViewer.csv.quoteMark`      | `"`      | Character that quotes a field                                             |
| `spreadsheetViewer.csv.hasHeaders`     | `true`   | Read the first line as column names                                       |
| `spreadsheetViewer.csv.lineNumbers`    | `none`   | `none`, `ordinal` for grid position, `source` for the line in the file     |
| `spreadsheetViewer.csv.formatValues`   | `always` | `never` shows every field exactly as written                              |
| `spreadsheetViewer.csv.numberFormat`   | `g2`     | Maximum decimal places, taken from the digits in the value                |
| `spreadsheetViewer.excel.showInfo`     | `true`   | Show the sheet name and its dimensions above the grid                     |

## Privacy

Reading and rendering are local. The extension performs no network requests and
collects no telemetry.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) for the local setup and the checks that
run before a pull request. Participation follows the
[Code of Conduct](CODE_OF_CONDUCT.md). To report a vulnerability, see the
[security policy](SECURITY.md).

## Third-Party

[Tabulator](https://github.com/olifolkerd/tabulator) and
[SheetJS](https://github.com/SheetJS/sheetjs) ship inside the extension under
their own licenses, which travel in the bundled files.

SheetJS is installed from the vendor's own tarball rather than from npm, which is
how upstream distributes it. The lockfile records its checksum, so `npm ci`
verifies the download; Dependabot cannot follow that source, so its version moves
by hand.

## License

[MIT](LICENSE) © [Antonio Abreu Filho](https://abreufilho.com.br)
