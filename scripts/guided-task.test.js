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
import { LEGACY_SOLUTION_MARKER } from '../dist/theme/Exercise/Answer.js';
import {
  isAnswerElement,
  isLegacySolutionElement,
} from '../dist/theme/Exercise/answerDetection.js';
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

// Regression: a pre-evaluated legacy adapter renders an <Answer> element with
// the internal legacy marker prop. GuidedTask must still recognise it as a
// legacy Solution for the Exercise legacy path.
const preEvaluatedLegacyAnswer = React.createElement(
  Answer,
  { [LEGACY_SOLUTION_MARKER]: true },
  'Pre-evaluated legacy answer',
);
assert.ok(
  isLegacySolutionElement(preEvaluatedLegacyAnswer),
  'Answer element carrying legacy marker should be detected as legacy Solution',
);
assert.ok(
  !isAnswerElement(preEvaluatedLegacyAnswer),
  'Answer element carrying legacy marker must not be detected as a normal Answer',
);
const preEvaluatedNewAnswer = React.createElement(Answer, null, 'New answer');
assert.ok(
  isAnswerElement(preEvaluatedNewAnswer),
  'regular Answer without legacy marker should be detected as a normal Answer',
);
assert.ok(
  !isLegacySolutionElement(preEvaluatedNewAnswer),
  'regular Answer without legacy marker should not be detected as legacy Solution',
);

// Regression: invoke <Solution> as a function to obtain its returned element
// (an <Answer> element carrying the legacy marker) and pass that captured
// element as a child of <Exercise>. This is the exact bug scenario: someone
// renders Solution eagerly, captures the resulting <Answer>, then hands it to
// Exercise. GuidedTask must still route it through the legacy Solution path.
const invokedSolutionElement = Solution({ children: 'Invoked legacy answer' });
assert.ok(
  React.isValidElement(invokedSolutionElement),
  'Solution should be callable as a function and return a React element',
);
assert.ok(
  isLegacySolutionElement(invokedSolutionElement),
  'Solution invocation output (Answer with marker) must be detected as legacy Solution',
);
assert.ok(
  !isAnswerElement(invokedSolutionElement),
  'Solution invocation output must not be detected as a normal Answer',
);
const invokedLegacyHtml = renderToStaticMarkup(
  React.createElement(Exercise, null, problem, invokedSolutionElement),
);
assert.match(
  invokedLegacyHtml,
  /Invoked legacy answer/,
  'Exercise should accept the pre-evaluated legacy Solution element obtained by calling Solution',
);
assert.doesNotMatch(
  invokedLegacyHtml,
  /ヒントを見る/,
  'pre-evaluated legacy Solution from calling Solution should not require Hint',
);

const preEvaluatedLegacyHtml = renderToStaticMarkup(
  React.createElement(Exercise, null, problem, preEvaluatedLegacyAnswer),
);
assert.match(
  preEvaluatedLegacyHtml,
  /Pre-evaluated legacy answer/,
  'Exercise legacy path should accept pre-evaluated legacy Answer',
);
assert.doesNotMatch(
  preEvaluatedLegacyHtml,
  /ヒントを見る/,
  'pre-evaluated legacy Answer should not require Hint',
);
assert.match(
  preEvaluatedLegacyHtml,
  /rensyuKaitou/,
  'pre-evaluated legacy Answer should preserve final DOM class string contract',
);
assert.match(
  preEvaluatedLegacyHtml,
  /rensyuKaitouNaiyou/,
  'pre-evaluated legacy Answer should preserve answer content class contract',
);

// Mixed-with-Hint / new-Answer scenarios: legacy-marked Answer routed through
// legacy path must still reject mixing with Hint or new Answer like any other
// legacy Solution.
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(Hint, null, 'Mixed hint'),
    preEvaluatedLegacyAnswer,
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    preEvaluatedLegacyAnswer,
    React.createElement(Answer, null, 'New answer after legacy'),
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(Hint, null, 'Only hint'),
    preEvaluatedLegacyAnswer,
    React.createElement(Answer, null, 'New answer after legacy'),
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
);

// QuickCheck must never accept legacy-marked Answer even if it bypasses the
// Solution wrapper.
const preEvaluatedLegacyAnswerForQuickCheck = React.createElement(
  Answer,
  { [LEGACY_SOLUTION_MARKER]: true },
  'Pre-evaluated legacy answer',
);
let quickCheckRejected = false;
try {
  renderToStaticMarkup(
    React.createElement(
      QuickCheck,
      null,
      problem,
      preEvaluatedLegacyAnswerForQuickCheck,
    ),
  );
} catch (error) {
  quickCheckRejected =
    error instanceof Error && /legacy Solution/.test(error.message);
}
assert.ok(
  quickCheckRejected,
  'QuickCheck should reject pre-evaluated legacy Answer',
);

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
