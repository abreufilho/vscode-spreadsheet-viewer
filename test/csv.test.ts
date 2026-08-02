import assert from 'node:assert/strict';
import test from 'node:test';
import { detectSeparator, parseCsv, resolveSeparator } from '../src/lib/csv';

test('resolves a named separator, and passes a literal one through', () => {
  assert.equal(resolveSeparator('semicolon'), ';');
  assert.equal(resolveSeparator('tab'), '\t');
  assert.equal(resolveSeparator('#'), '#');
});

test('detects the separator from the first line', () => {
  assert.equal(detectSeparator('a;b;c\nd;e;f'), ';');
  assert.equal(detectSeparator('a\tb\tc'), '\t');
  assert.equal(detectSeparator('single'), ',');
});

test('ignores later lines when detecting', () => {
  assert.equal(detectSeparator('a,b\nc;d;e;f;g'), ',');
});

test('parses rows and honours CRLF', () => {
  assert.deepEqual(parseCsv('a,b\r\nc,d\r\n', ',', '"'), [
    ['a', 'b'],
    ['c', 'd'],
  ]);
});

test('keeps separators and line breaks inside quoted fields', () => {
  assert.deepEqual(parseCsv('"a,b",c\n', ',', '"'), [['a,b', 'c']]);
  assert.deepEqual(parseCsv('"line\nbreak",c\n', ',', '"'), [['line\nbreak', 'c']]);
});

test('reads a doubled quote as a literal quote', () => {
  assert.deepEqual(parseCsv('"say ""hi""",c\n', ',', '"'), [['say "hi"', 'c']]);
});

test('drops blank lines instead of rendering empty rows', () => {
  assert.deepEqual(parseCsv('a,b\n\nc,d\n', ',', '"'), [
    ['a', 'b'],
    ['c', 'd'],
  ]);
});

test('keeps a row whose fields are empty but separated', () => {
  assert.deepEqual(parseCsv(',\n', ',', '"'), [['', '']]);
});

test('returns the last row when the text does not end in a break', () => {
  assert.deepEqual(parseCsv('a,b', ',', '"'), [['a', 'b']]);
});

test('returns nothing for empty input', () => {
  assert.deepEqual(parseCsv('', ',', '"'), []);
});
