import assert from 'node:assert/strict';
import test from 'node:test';
import { baseName, kindForPath, selectTargetUri } from '../src/lib/document';

test('maps delimited and workbook extensions to their kind', () => {
  assert.equal(kindForPath('/data/report.csv'), 'csv');
  assert.equal(kindForPath('/data/report.tsv'), 'csv');
  assert.equal(kindForPath('/data/report.tab'), 'csv');
  assert.equal(kindForPath('/data/report.xlsx'), 'excel');
  assert.equal(kindForPath('/data/report.xlsm'), 'excel');
});

test('ignores case in the extension', () => {
  assert.equal(kindForPath('/data/REPORT.CSV'), 'csv');
});

test('returns null for anything it does not preview', () => {
  assert.equal(kindForPath('/data/report.txt'), null);
  assert.equal(kindForPath('/data/report'), null);
  assert.equal(kindForPath(undefined), null);
});

test('does not read a directory suffix as an extension', () => {
  assert.equal(kindForPath('/data.csv/report'), null);
});

test('takes the last path segment', () => {
  assert.equal(baseName('/data/quarter one.csv'), 'quarter one.csv');
  assert.equal(baseName('report.csv'), 'report.csv');
  assert.equal(baseName(''), '');
  assert.equal(baseName(undefined), '');
});

test('prefers the explicit uri, then the editor, then the active tab', () => {
  assert.equal(selectTargetUri('explicit', 'editor', { uri: 'tab' }), 'explicit');
  assert.equal(selectTargetUri(undefined, 'editor', { uri: 'tab' }), 'editor');
  assert.equal(selectTargetUri(undefined, undefined, { uri: 'tab' }), 'tab');
  assert.equal(selectTargetUri(undefined, undefined, undefined), undefined);
});
