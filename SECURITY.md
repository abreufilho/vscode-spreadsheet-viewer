# Security Policy

## Supported Versions

The latest release receives fixes. Older versions do not.

## Reporting a Vulnerability

Report privately through
[GitHub Security Advisories](https://github.com/abreufilho/vscode-spreadsheet-viewer/security/advisories/new).
Please do not open a public issue for a vulnerability.

This is a personal project maintained on a best-effort basis. There is no
response time commitment. If a report needs a fix that I cannot make, I will say
so rather than leave it open.

## Scope

The extension renders spreadsheets the user opens. That content is untrusted, so
the preview:

- serves the webview under a Content Security Policy where scripts run by nonce
  only and no origin is reachable;
- puts cell values and column titles into the grid as text nodes, so a field
  holding markup is shown rather than parsed;
- reports read and render failures as status text, never as markup;
- makes no network request, and ships the grid rather than fetching it.

Parsing a workbook is delegated to SheetJS. A flaw in how it reads a file
belongs upstream, but report it here as well and I will forward it.
