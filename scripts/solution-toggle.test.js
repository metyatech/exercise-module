import assert from 'node:assert/strict';
import React, {act} from 'react';
import {JSDOM} from 'jsdom';
import {createRoot} from 'react-dom/client';
import Solution, {SOLUTION_COMPONENT_NAME} from '../dist/theme/Exercise/Solution.js';
import {
  SolutionRegistrationContext,
} from '../dist/theme/Exercise/solutionContext.js';
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

const resolveSolutionRegistration = (current, payload) => {
  const isAction =
    payload &&
    typeof payload === 'object' &&
    '__exerciseSolutionAction' in payload;
  const action = isAction
    ? payload
    : {__exerciseSolutionAction: 'set', content: payload};
  if (action.__exerciseSolutionAction === 'clear') {
    return current === action.content ? null : current;
  }
  return current ?? action.content;
};

function SolutionHarness({showFirst, showSecond}) {
  const [content, setContent] = React.useState(null);
  const registerSolution = React.useCallback((payload) => {
    setContent((current) => resolveSolutionRegistration(current, payload));
  }, []);
  return React.createElement(
    SolutionRegistrationContext.Provider,
    {value: registerSolution},
    React.createElement(
      'div',
      {'data-problem': 'true'},
      showFirst ? React.createElement(Solution, null, 'Answer 1') : null,
      showSecond ? React.createElement(Solution, null, 'Answer 2') : null,
    ),
    React.createElement('div', {'data-solution': 'true'}, content),
  );
}

await act(async () => {
  reactRoot.render(
    React.createElement(SolutionHarness, {showFirst: true, showSecond: true}),
  );
});

const SOLUTION_TIMEOUT_MS = 1000;

const waitForSolutionMatch = async (
  predicate,
  timeoutMs = SOLUTION_TIMEOUT_MS,
) => {
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
    if (predicate(solutionContainer.textContent ?? '')) {
      cleanup();
      resolve();
      return;
    }
    observer = new dom.window.MutationObserver(() => {
      if (predicate(solutionContainer.textContent ?? '')) {
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
  await waitForSolutionMatch((text) => text.includes('Answer 1'));
});

const problem = dom.window.document.querySelector('[data-problem]');
const solution = dom.window.document.querySelector('[data-solution]');
assert.ok(problem, 'problem container should exist');
assert.ok(solution, 'solution container should exist');
assert.ok(
  !problem?.textContent?.includes('Answer 1') &&
    !problem?.textContent?.includes('Answer 2'),
  'should not render answer inline when context is present',
);
assert.ok(
  solution?.textContent?.includes('Answer 1'),
  'should register answer when context is present',
);
assert.ok(
  !solution?.textContent?.includes('Answer 2'),
  'should keep the first registered Solution content',
);

await act(async () => {
  reactRoot.render(
    React.createElement(SolutionHarness, {showFirst: true, showSecond: false}),
  );
});
await act(async () => {
  await waitForSolutionMatch((text) => text.includes('Answer 1'));
});
assert.ok(
  solution?.textContent?.includes('Answer 1'),
  'should keep the first Solution content when another unmounts',
);

await act(async () => {
  reactRoot.render(
    React.createElement(SolutionHarness, {showFirst: false, showSecond: false}),
  );
});
await act(async () => {
  await waitForSolutionMatch((text) => text.trim() === '');
});
assert.ok(
  solution?.textContent?.trim() === '',
  'should clear the Solution content when it unmounts',
);

await act(async () => {
  reactRoot.unmount();
});

console.log('solution-toggle test passed');
