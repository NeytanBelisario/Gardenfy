import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const queryString = require('query-string');

test('navigation query parsing preserves accented names, repeated values and valid zeros', () => {
  const parsed = queryString.parse('nome=Costela+de-ad%C3%A3o&id=0&tag=folha&tag=flor');
  assert.equal(parsed.nome, 'Costela de-adão');
  assert.equal(parsed.id, '0');
  assert.deepEqual(parsed.tag, ['folha', 'flor']);
  assert.equal(queryString.parse(queryString.stringify(parsed)).nome, parsed.nome);
});

test('malformed percent sequences cannot block navigation query parsing', () => {
  // Run separately with a timeout so a decoder regression cannot hang the suite.
  const output = execFileSync(process.execPath, ['-e',
    "const q = require('query-string'); const v = '%FF'.repeat(10000); if (q.parse('value=' + v).value !== v) process.exit(1);",
  ], { cwd: process.cwd(), timeout: 2000 });
  assert.equal(output.length, 0);
});
