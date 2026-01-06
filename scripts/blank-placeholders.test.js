import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {applyBlankPlaceholders} from '../dist/theme/Exercise/blanks.js';

const blank = (value) => `$` + `{${value}}`;

const html =
  '<div id="root">' +
  '<div class="rensyuNaiyou">' +
  '<p>opacity: ' +
  blank('alpha') +
  ';</p>' +
  '<pre><code>' +
  '<span class="token punctuation">$</span>' +
  '<span class="token punctuation">{</span>' +
  '<span class="token string">beta</span>' +
  '<span class="token punctuation">}</span>' +
  '</code></pre>' +
  '</div>' +
  '<div class="rensyuKaitouNaiyou">' +
  '<p>' +
  blank('alpha') +
  '</p>' +
  '<p>' +
  blank('beta') +
  '</p>' +
  '</div>' +
  '</div>';

const dom = new JSDOM(html);
globalThis.document = dom.window.document;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.Node = dom.window.Node;

const root = dom.window.document.getElementById('root');
assert.ok(root, 'root should exist');

applyBlankPlaceholders(root);

const inputs = root.querySelectorAll('.rensyuBlankInput');
const tags = root.querySelectorAll('.rensyuBlankTag');

assert.equal(inputs.length, 2, 'should create two input blanks in problem');
assert.equal(tags.length, 2, 'should create two tags in solution');
assert.ok(!root.textContent?.includes('${'), 'placeholders should be removed');

const firstBadge = inputs[0]?.parentElement?.querySelector('.rensyuBlankBadge');
assert.equal(firstBadge?.textContent, '1', 'first badge should be 1');
assert.equal(tags[1]?.textContent, '2', 'second tag should be 2');
assert.ok(
  root.textContent?.includes('alpha') && root.textContent?.includes('beta'),
  'solution should include answers',
);

console.log('blank-placeholders test passed');
