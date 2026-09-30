import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));

// Build-tool overrides retain the CommonJS API consumed by these parents.
for (const parent of ['copy-webpack-plugin', 'css-minimizer-webpack-plugin']) {
  const parentRequire = createRequire(require.resolve(parent));
  const serialize = parentRequire('serialize-javascript');
  const normal = { pattern: /hello/gi, date: new Date('2026-01-01'), value: 3 };
  const decoded = vm.runInNewContext('(' + serialize(normal) + ')');
  assert.equal(decoded.pattern.source, 'hello');
  assert.equal(decoded.date.toISOString(), normal.date.toISOString());
  assert.equal(decoded.value, 3);

  // GHSA-5c6j-r48x-rmvq: spoofed RegExp flags must never execute code.
  const fake = Object.create(RegExp.prototype);
  Object.defineProperty(fake, 'source', { get: () => 'x' });
  Object.defineProperty(fake, 'flags', {
    get: () => '"+(globalThis.injected=true)+"',
  });
  const context = { injected: false };
  try {
    vm.runInNewContext('(' + serialize({ re: fake }) + ')', context);
  } catch (error) {
    assert.equal(error.name, 'SyntaxError');
  }
  assert.equal(context.injected, false);
}

// SockJS uses only CommonJS uuid.v4(); the patched release preserves that API.
const sockRequire = createRequire(require.resolve('sockjs'));
const uuid = sockRequire('uuid');
assert.equal(uuid.validate(uuid.v4()), true);
assert.throws(
  () => uuid.v3('name', uuid.v3.DNS, new Uint8Array(1)),
  RangeError,
);
assert.ok(require('sockjs').createServer());

assert.equal(pkg.overrides['serialize-javascript'], '7.0.5');
assert.deepEqual(pkg.overrides.sockjs, { uuid: '11.1.1' });
assert.equal(
  lock.packages['node_modules/serialize-javascript'].version,
  '7.0.5',
);
assert.match(pkg.scripts.verify, /npm audit$/);
console.log('dependency security and parent API compatibility tests passed');
