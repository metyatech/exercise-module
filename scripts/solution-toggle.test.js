import assert from 'node:assert/strict';
import React, {act} from 'react';
import {JSDOM} from 'jsdom';
import {createRoot} from 'react-dom/client';
import Solution, {SOLUTION_COMPONENT_NAME} from '../dist/theme/Exercise/Solution.js';
import {SolutionRegistrationContext} from '../dist/theme/Exercise/solutionContext.js';
import {isSolutionElement} from '../dist/theme/Exercise/solutionDetection.js';

const solutionElement = React.createElement(
  Solution,
  null,
  React.createElement('p', null, 'Answer'),
);

assert.ok(isSolutionElement(solutionElement), 'should detect Solution element');

function FakeSolution({children}) {
  return React.createElement(React.Fragment, null, children);
}

FakeSolution.displayName = SOLUTION_COMPONENT_NAME;
FakeSolution.__exerciseSolution = true;

const fakeElement = React.createElement(
  FakeSolution,
  null,
  React.createElement('p', null, 'Answer'),
);

assert.ok(
  isSolutionElement(fakeElement),
  'should detect Solution element even when reference differs',
);

const regularElement = React.createElement('div', null, 'No solution');
assert.ok(!isSolutionElement(regularElement), 'should ignore regular elements');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const root = dom.window.document.getElementById('root');
assert.ok(root, 'root should exist');

const reactRoot = createRoot(root);

function SolutionHarness() {
  const [content, setContent] = React.useState(null);
  return React.createElement(
    SolutionRegistrationContext.Provider,
    {value: setContent},
    React.createElement(
      'div',
      {'data-problem': 'true'},
      React.createElement(Solution, null, 'Answer'),
    ),
    React.createElement('div', {'data-solution': 'true'}, content),
  );
}

await act(async () => {
  reactRoot.render(React.createElement(SolutionHarness));
});

const waitForSolutionContent = async (timeoutMs = 1000) => {
  await new Promise((resolve, reject) => {
    let observer;
    const timeoutId = dom.window.setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }
      reject(new Error('Timed out waiting for solution content'));
    }, timeoutMs);

    const cleanup = () => {
      dom.window.clearTimeout(timeoutId);
    };

    const solutionContainer = dom.window.document.querySelector('[data-solution]');
    if (!solutionContainer) {
      cleanup();
      resolve();
      return;
    }
    if (solutionContainer.textContent?.includes('Answer')) {
      cleanup();
      resolve();
      return;
    }
    observer = new dom.window.MutationObserver(() => {
      if (solutionContainer.textContent?.includes('Answer')) {
        observer.disconnect();
        cleanup();
        resolve();
      }
    });
    observer.observe(solutionContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
};

await act(async () => {
  await waitForSolutionContent();
});

const problem = dom.window.document.querySelector('[data-problem]');
const solution = dom.window.document.querySelector('[data-solution]');
assert.ok(problem, 'problem container should exist');
assert.ok(solution, 'solution container should exist');
assert.ok(
  !problem?.textContent?.includes('Answer'),
  'should not render answer inline when context is present',
);
assert.ok(
  solution?.textContent?.includes('Answer'),
  'should register answer when context is present',
);

await act(async () => {
  reactRoot.unmount();
});

console.log('solution-toggle test passed');
