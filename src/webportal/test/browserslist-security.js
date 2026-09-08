// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const browserslist = require('browserslist');

// GHSA-73wf-gq98-2v4g: untrusted stats must not crash unrelated queries.
// JSON.parse preserves __proto__ as an own property rather than object syntax.
const expected = browserslist('defaults', { stats: {} });
const keys = [
  '__proto__',
  'toString',
  'valueOf',
  'hasOwnProperty',
  'constructor',
  'isPrototypeOf',
];
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pai-browserslist-'));
try {
  for (const key of keys) {
    const stats = JSON.parse(`{"${key}":{"onekey":5},"chrome":{"100":50}}`);
    assert.deepStrictEqual(
      browserslist('defaults', { stats }),
      expected,
      `programmatic stats: ${key}`,
    );

    // A poisoned file in a parent directory is auto-discovered even when the
    // query does not request custom stats, as happens in Babel/Autoprefixer.
    const fixture = path.join(root, key);
    const child = path.join(fixture, 'project');
    fs.mkdirSync(child, { recursive: true });
    fs.writeFileSync(
      path.join(fixture, 'browserslist-stats.json'),
      JSON.stringify(stats),
    );
    browserslist.clearCaches();
    assert.deepStrictEqual(
      browserslist('defaults', { path: child }),
      expected,
      `auto-discovered stats: ${key}`,
    );
  }
  console.log('Browserslist security regression: 6 keys, 12 cases passed.');
} finally {
  browserslist.clearCaches();
  fs.rmSync(root, { recursive: true, force: true });
}
