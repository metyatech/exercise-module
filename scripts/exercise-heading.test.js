import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import Exercise from '../dist/theme/Exercise/index.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const root = dom.window.document.getElementById('root');
assert.ok(root, 'root should exist');

const reactRoot = createRoot(root);

await act(async () => {
  reactRoot.render(
    React.createElement(
      Exercise,
      { title: 'Should not render' },
      React.createElement('h3', null, 'Explicit heading'),
      React.createElement('p', null, 'Body'),
    ),
  );
});

const headings = dom.window.document.querySelectorAll('h3');
assert.equal(headings.length, 1, 'should not inject headings automatically');
assert.equal(headings[0]?.textContent, 'Explicit heading');

const section = root?.firstElementChild;
assert.ok(section, 'section should render');
assert.ok(
  !section.textContent?.includes('Should not render'),
  'title prop should not render into the DOM',
);

await act(async () => {
  reactRoot.unmount();
});

console.log('exercise-heading test passed');
