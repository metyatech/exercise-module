import assert from 'node:assert/strict';
import fs from 'node:fs';

import exercisePlugin from '../dist/index.js';

assert.equal(
  typeof exercisePlugin,
  'function',
  'default export should be a function',
);

const pluginDts = fs.readFileSync('dist/plugin.d.ts', 'utf8');
assert.ok(
  /export default function exercisePlugin\(_context: LoadContext, _options\?: ExercisePluginOptions\): Plugin;/.test(
    pluginDts,
  ),
  'dist/plugin.d.ts should declare the plugin signature as (context, options) => Plugin',
);

const plugin = exercisePlugin({}, {});
assert.equal(
  plugin.name,
  '@metyatech/docusaurus-plugin-exercise',
  'plugin name should be stable',
);
assert.equal(
  typeof plugin.getThemePath,
  'function',
  'getThemePath should exist',
);
assert.equal(
  typeof plugin.getTypeScriptThemePath,
  'function',
  'getTypeScriptThemePath should exist',
);
assert.ok(plugin.getThemePath(), 'getThemePath should return a path');
assert.ok(
  plugin.getTypeScriptThemePath(),
  'getTypeScriptThemePath should return a path',
);

console.log('plugin-signature test passed');
