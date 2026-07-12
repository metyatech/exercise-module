import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import Exercise, {
  Answer,
  Hint,
  QuickCheck,
  Solution,
} from '../dist/theme/Exercise/index.js';
import ClientExercise, {
  Answer as ClientAnswer,
  Hint as ClientHint,
  QuickCheck as ClientQuickCheck,
  Solution as ClientSolution,
} from '../dist/client.js';

const blank = (value) => `$` + `{${value}}`;

const renderExercise = (...children) =>
  renderToStaticMarkup(React.createElement(Exercise, null, ...children));

const problem = React.createElement('p', null, 'Problem text');
const hint = React.createElement(Hint, null, 'Hint text');
const answer = React.createElement(Answer, null, 'Answer text');

const directAnswerHtml = renderExercise(problem, hint, answer);
assert.match(directAnswerHtml, /Problem text/, 'should render problem content');
assert.match(directAnswerHtml, /ヒントを見る/, 'should label one hint');
assert.match(directAnswerHtml, /解答を見る/, 'should label Exercise answer');
assert.match(directAnswerHtml, /Answer text/, 'should render Answer content');

const multipleHintsHtml = renderExercise(
  problem,
  React.createElement(Hint, null, 'Hint 1'),
  React.createElement(Hint, null, 'Hint 2'),
  answer,
);
assert.match(multipleHintsHtml, /ヒント1/, 'should number first hint');
assert.match(multipleHintsHtml, /ヒント2/, 'should number second hint');

const quickCheckHtml = renderToStaticMarkup(
  React.createElement(
    QuickCheck,
    null,
    problem,
    hint,
    React.createElement(Answer, null, 'Quick answer'),
  ),
);
assert.match(
  quickCheckHtml,
  /rensyuQuickCheck/,
  'QuickCheck should render modifier class',
);
assert.match(
  quickCheckHtml,
  /rensyuQuickCheckTitle/,
  'QuickCheck should render title class',
);
assert.match(quickCheckHtml, /答えを見る/, 'should label QuickCheck answer');

const legacyHtml = renderToStaticMarkup(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(Solution, null, 'Legacy answer'),
  ),
);
assert.match(
  legacyHtml,
  /Legacy answer/,
  'Exercise should allow legacy Solution',
);
assert.doesNotMatch(
  legacyHtml,
  /ヒントを見る/,
  'legacy Solution should not require Hint',
);

const assertStructureError = (element, message) => {
  assert.throws(
    () => renderToStaticMarkup(element),
    (error) => {
      assert.ok(error instanceof Error, 'should throw Error');
      assert.match(error.message, message);
      assert.match(error.message, /Actual order:/);
      assert.match(error.message, /Expected order:/);
      return true;
    },
  );
};

assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(Solution, null, 'Legacy'),
    hint,
    answer,
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
);
assertStructureError(
  React.createElement(Exercise, null, problem, answer),
  /at least one Hint is required/,
);
assertStructureError(
  React.createElement(Exercise, null, problem, hint),
  /exactly one Answer is required/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    hint,
    answer,
    React.createElement(Answer, null, 'Again'),
  ),
  /exactly one Answer is required/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    hint,
    answer,
    React.createElement('p', null, 'After'),
  ),
  /content after Answer is not allowed/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(
      QuickCheck,
      null,
      problem,
      hint,
      React.createElement(Answer, null, 'Nested answer'),
    ),
    hint,
    answer,
  ),
  /nested Exercise or QuickCheck is not allowed/,
);
assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    problem,
    React.createElement(Solution, null, 'Legacy answer'),
  ),
  /QuickCheck does not allow legacy Solution/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(Hint, null, ''),
    answer,
  ),
  /Hint content must not be empty/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    hint,
    React.createElement(Answer, null, ''),
  ),
  /Answer content must not be empty/,
);

assert.equal(
  ClientExercise,
  Exercise,
  'client default export should be Exercise',
);
assert.equal(ClientAnswer, Answer, 'client should export Answer');
assert.equal(ClientHint, Hint, 'client should export Hint');
assert.equal(ClientQuickCheck, QuickCheck, 'client should export QuickCheck');
assert.equal(ClientSolution, Solution, 'client should export legacy Solution');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const dom = new JSDOM('<!doctype html><div id="root"></div>');
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.MutationObserver = dom.window.MutationObserver;

const root = dom.window.document.getElementById('root');
assert.ok(root, 'root should exist');

const reactRoot = createRoot(root);
await act(async () => {
  reactRoot.render(
    React.createElement(
      Exercise,
      { enableBlanks: true },
      React.createElement('p', null, `Problem ${blank('alpha')}`),
      React.createElement(Hint, null, `Hint ${blank('hint-only')}`),
      React.createElement(Answer, null, 'Answer explanation'),
    ),
  );
});

assert.equal(
  root.querySelectorAll('.rensyuNaiyou .rensyuBlankInput').length,
  1,
  'enableBlanks should apply inputs to problem area',
);
assert.match(
  root.querySelector('.rensyuHintNaiyou')?.textContent ?? '',
  /\$\{hint-only\}/,
  'Hint placeholders should not become blanks',
);
assert.equal(
  root.querySelectorAll('.rensyuKaitouNaiyou .rensyuBlankTag').length,
  1,
  'Answer area should preserve auto answer list tags',
);
assert.match(
  root.querySelector('.rensyuKaitouNaiyou')?.textContent ?? '',
  /alpha/,
  'Answer area should include auto answer text',
);

const styleText =
  dom.window.document.getElementById('metyatech-exercise-style')?.textContent ??
  '';
assert.match(styleText, /\[data-theme='dark'\] \.rensyuHint/);
assert.match(styleText, /\[data-theme='dark'\] \.rensyuQuickCheck/);

await act(async () => {
  reactRoot.unmount();
});

console.log('guided-task test passed');
