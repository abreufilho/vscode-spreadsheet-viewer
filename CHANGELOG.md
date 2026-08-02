# Changelog

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-08-01

First public release.

### Added

- Custom editor for `.csv`, `.tsv` and `.tab` files, with a configurable
  separator, quoted fields, optional headers and optional line numbers.
- Custom editor for `.xlsx` and `.xlsm` workbooks, with one tab per worksheet.
- Sorting by column and a filter on each column header.
- Column widths, sort order and scroll position kept per file, and a command to
  reset them.
- Reload when the file changes on disk, and close when it is deleted.
- Light and dark rendering that follows the active VS Code theme.
