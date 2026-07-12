import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import Answer, {
  ANSWER_COMPONENT_NAME,
} from '../dist/theme/Exercise/Answer.js';
import { AnswerRegistrationContext } from '../dist/theme/Exercise/answerContext.js';
import { isAnswerElement } from '../dist/theme/Exercise/answerDetection.js';

const answerElement = React.createElement(
  Answer,
  null,
  React.createElement('p', null, 'Answer'),
);

assert.ok(isAnswerElement(answerElement), 'should detect Answer element');

function FakeAnswer({ children }) {
  return React.createElement(React.Fragment, null, children);
}

FakeAnswer.displayName = ANSWER_COMPONENT_NAME;
FakeAnswer.__exerciseAnswer = true;

const fakeElement = React.createElement(
  FakeAnswer,
  null,
  React.createElement('p', null, 'Answer'),
);

assert.ok(
  isAnswerElement(fakeElement),
  'should detect Answer element even when reference differs',
);

const memoElement = React.createElement(
  React.memo(Answer),
  null,
  React.createElement('p', null, 'Memo answer'),
);
assert.ok(isAnswerElement(memoElement), 'should detect memo-wrapped Answer');

const ForwardedAnswer = React.forwardRef(function ExerciseAnswer(props, ref) {
  return React.createElement('div', { ref }, props.children);
});
const forwardedElement = React.createElement(
  ForwardedAnswer,
  null,
  React.createElement('p', null, 'Forwarded answer'),
);
assert.ok(
  isAnswerElement(forwardedElement),
  'should detect forwardRef Answer by internal render name',
);

const regularElement = React.createElement('div', null, 'No answer');
assert.ok(!isAnswerElement(regularElement), 'should ignore regular elements');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;

const root = dom.window.document.getElementById('root');
assert.ok(root, 'root should exist');

const reactRoot = createRoot(root);

const resolveAnswerRegistration = (current, payload) => {
  const isAction =
    payload &&
    typeof payload === 'object' &&
    '__exerciseAnswerAction' in payload;
  const action = isAction
    ? payload
    : { __exerciseAnswerAction: 'set', content: payload };
  if (action.__exerciseAnswerAction === 'clear') {
    return current === action.content ? null : current;
  }
  return current ?? action.content;
};

function AnswerHarness({ showFirst, showSecond, strict = false }) {
  const [content, setContent] = React.useState(null);
  const registerAnswer = React.useCallback((payload) => {
    setContent((current) => resolveAnswerRegistration(current, payload));
  }, []);
  const body = React.createElement(
    AnswerRegistrationContext.Provider,
    { value: registerAnswer },
    React.createElement(
      'div',
      { 'data-problem': 'true' },
      showFirst ? React.createElement(Answer, null, 'Answer 1') : null,
      showSecond ? React.createElement(Answer, null, 'Answer 2') : null,
    ),
    React.createElement('div', { 'data-answer': 'true' }, content),
  );
  return strict ? React.createElement(React.StrictMode, null, body) : body;
}

await act(async () => {
  reactRoot.render(
    React.createElement(AnswerHarness, { showFirst: true, showSecond: true }),
  );
});

const ANSWER_TIMEOUT_MS = 1000;

const waitForAnswerMatch = async (predicate, timeoutMs = ANSWER_TIMEOUT_MS) => {
  await new Promise((resolve, reject) => {
    let observer;
    const timeoutId = dom.window.setTimeout(() => {
      if (observer) {
        observer.disconnect();
      }
      reject(new Error('Timed out waiting for answer content'));
    }, timeoutMs);

    const cleanup = () => {
      dom.window.clearTimeout(timeoutId);
    };

    const answerContainer = dom.window.document.querySelector('[data-answer]');
    if (!answerContainer) {
      cleanup();
      resolve();
      return;
    }
    if (predicate(answerContainer.textContent ?? '')) {
      cleanup();
      resolve();
      return;
    }
    observer = new dom.window.MutationObserver(() => {
      if (predicate(answerContainer.textContent ?? '')) {
        observer.disconnect();
        cleanup();
        resolve();
      }
    });
    observer.observe(answerContainer, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  });
};

await act(async () => {
  await waitForAnswerMatch((text) => text.includes('Answer 1'));
});

const problem = dom.window.document.querySelector('[data-problem]');
const answer = dom.window.document.querySelector('[data-answer]');
assert.ok(problem, 'problem container should exist');
assert.ok(answer, 'answer container should exist');
assert.ok(
  !problem?.textContent?.includes('Answer 1') &&
    !problem?.textContent?.includes('Answer 2'),
  'should not render answer inline when context is present',
);
assert.ok(
  answer?.textContent?.includes('Answer 1'),
  'should register answer when context is present',
);
assert.ok(
  !answer?.textContent?.includes('Answer 2'),
  'should keep the first registered Answer content',
);

await act(async () => {
  reactRoot.render(
    React.createElement(AnswerHarness, {
      showFirst: true,
      showSecond: false,
      strict: true,
    }),
  );
});
await act(async () => {
  await waitForAnswerMatch((text) => text.includes('Answer 1'));
});
const strictAnswer = dom.window.document.querySelector('[data-answer]');
assert.ok(
  strictAnswer?.textContent?.includes('Answer 1'),
  'should keep Answer registration stable in Strict Mode',
);

await act(async () => {
  reactRoot.render(
    React.createElement(AnswerHarness, {
      showFirst: false,
      showSecond: false,
    }),
  );
});
await act(async () => {
  await waitForAnswerMatch((text) => text.trim() === '');
});
const clearedAnswer = dom.window.document.querySelector('[data-answer]');
assert.ok(
  clearedAnswer?.textContent?.trim() === '',
  'should clear the Answer content when it unmounts',
);

await act(async () => {
  reactRoot.unmount();
});

console.log('answer-toggle test passed');
