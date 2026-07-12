import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import {
  applyBlankPlaceholders,
  applyBlankPlaceholdersIfNeeded,
  startBlankPlaceholderObserver,
} from '../dist/theme/Exercise/blanks.js';

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
  '<div class="rensyuHintNaiyou">' +
  '<p>ヒント ' +
  blank('hint-only') +
  '</p>' +
  '</div>' +
  '<div class="rensyuKaitouNaiyou">' +
  '<p>解説 ' +
  blank('alpha') +
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
const answerRoot = root.querySelector('.rensyuKaitouNaiyou');
const hintRoot = root.querySelector('.rensyuHintNaiyou');
const autoAnswers = root.querySelector('[data-blank-answers="true"]');

assert.equal(inputs.length, 2, 'should create two input blanks in problem');
assert.equal(tags.length, 1, 'should create direct tags in answer');
assert.ok(
  root.querySelector('.rensyuNaiyou')?.textContent?.includes('${') === false,
  'problem placeholders should be removed',
);
assert.ok(answerRoot, 'answer root should exist');
assert.ok(hintRoot, 'hint root should exist');
assert.ok(
  hintRoot?.textContent?.includes(blank('hint-only')),
  'hint placeholders should not become blanks',
);
assert.equal(
  answerRoot?.firstElementChild?.textContent?.includes('alpha'),
  true,
  'direct answer tags should stay in answer content',
);

const firstBadge = inputs[0]?.parentElement?.querySelector('.rensyuBlankBadge');
assert.equal(firstBadge?.textContent, '1', 'first badge should be 1');
assert.equal(tags[0]?.textContent, '1', 'answer tag should be 1');
assert.ok(
  root.textContent?.includes('alpha'),
  'answer should include direct placeholder answers',
);
assert.equal(
  autoAnswers,
  null,
  'auto answer list should not duplicate direct tags',
);

const autoHtml =
  '<div id="auto-root">' +
  '<div class="rensyuNaiyou"><p>width: ' +
  blank('wide') +
  ';</p></div>' +
  '<div class="rensyuKaitouNaiyou"><p>解説</p></div>' +
  '</div>';

const autoDom = new JSDOM(autoHtml);
globalThis.document = autoDom.window.document;
globalThis.NodeFilter = autoDom.window.NodeFilter;
globalThis.Node = autoDom.window.Node;

const autoRoot = autoDom.window.document.getElementById('auto-root');
assert.ok(autoRoot, 'auto answer root should exist');
applyBlankPlaceholders(autoRoot);
assert.ok(
  autoRoot.querySelector('[data-blank-answers="true"]'),
  'auto answer list should be inserted when Answer has no placeholders',
);
assert.match(
  autoRoot.querySelector('.rensyuKaitouNaiyou')?.textContent ?? '',
  /wide/,
  'auto answer list should include problem answer text',
);

console.log('blank-placeholders test passed');

const waitForMutations = async () =>
  new Promise((resolve) => setTimeout(resolve, 0));

const reloadHtml =
  '<div id="root">' +
  '<div class="rensyuNaiyou">' +
  '<p>color: ' +
  blank('delta') +
  ';</p>' +
  '</div>' +
  '</div>';

const reloadDom = new JSDOM(reloadHtml);
globalThis.document = reloadDom.window.document;
globalThis.NodeFilter = reloadDom.window.NodeFilter;
globalThis.Node = reloadDom.window.Node;
globalThis.MutationObserver = reloadDom.window.MutationObserver;

const reloadRoot = reloadDom.window.document.getElementById('root');
assert.ok(reloadRoot, 'reload root should exist');

const cleanupObserver = startBlankPlaceholderObserver(reloadRoot);
await waitForMutations();

assert.ok(
  reloadRoot.querySelectorAll('.rensyuBlankInput').length > 0,
  'should create blanks on initial load',
);

const problemRoot = reloadRoot.querySelector('.rensyuNaiyou');
assert.ok(problemRoot, 'problem root should exist');
problemRoot.innerHTML = `<p>color: ${blank('echo')};</p>`;

await waitForMutations();

assert.ok(
  reloadRoot.querySelectorAll('.rensyuBlankInput').length > 0,
  'should reapply blanks after content rerender without Exercise rerender',
);
assert.ok(
  !reloadRoot.textContent?.includes('${'),
  'placeholders should be removed after reload',
);

cleanupObserver();

console.log('blank-placeholders reload test passed');
