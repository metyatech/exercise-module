import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
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

const createClientReference = (id) => {
  const clientReference = () => null;
  Object.defineProperty(clientReference, '$$id', {
    value: id,
  });
  return clientReference;
};

const UndetectableLegacySolution = ({ children }) =>
  React.createElement(Solution, null, children);

// Next/RSC regression: MDX can pass a client-reference function whose only
// useful identity is a $$id ending in this package's Solution export. The
// legacy Exercise path must classify it as Solution, not as problem content.
const clientReferenceSolution = createClientReference(
  '@metyatech/exercise/dist/client.js#Solution',
);
const windowsClientReferenceSolution = createClientReference(
  String.raw`D:\ghws\course-docs-site\node_modules\@metyatech\exercise\dist\client.js#Solution`,
);
const webpackClientReferenceSolution = createClientReference(
  'webpack://course-docs-site/./node_modules/@metyatech/exercise/dist/client.js#Solution',
);
const rscBundledClientReferenceSolution = createClientReference(
  'webpack-internal:///(rsc)/./node_modules/.../client.js#Solution',
);
const opaqueBundledClientReferenceSolution = createClientReference(
  'some-bundled-id#Solution',
);
const rscBundledClientReferenceHint = createClientReference(
  'webpack-internal:///(rsc)/./node_modules/.../client.js#Hint',
);
const rscBundledClientReferenceAnswer = createClientReference(
  'webpack-internal:///(rsc)/./node_modules/.../client.js#Answer',
);
const opaqueBundledClientReferenceHint = createClientReference(
  'some-bundled-id#Hint',
);
const opaqueBundledClientReferenceAnswer = createClientReference(
  'some-bundled-id#Answer',
);

const windowsClientReferenceSolutionElement = React.createElement(
  windowsClientReferenceSolution,
  null,
  'Windows client reference legacy answer',
);
assert.ok(
  isLegacySolutionElement(windowsClientReferenceSolutionElement),
  'exact Windows client-reference $$id should be detected as legacy Solution',
);
assert.ok(
  !isAnswerElement(windowsClientReferenceSolutionElement),
  'exact Windows client-reference $$id must not be detected as normal Answer',
);
const windowsClientReferenceLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text before Windows client reference Solution.',
    windowsClientReferenceSolutionElement,
  ),
);
assert.doesNotMatch(
  windowsClientReferenceLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'Windows client-reference legacy Exercise must not require Hint',
);
assert.match(
  windowsClientReferenceLegacyHtml,
  /Problem text before Windows client reference Solution\./,
  'Windows client-reference legacy Exercise must keep textual problem content',
);
assert.match(
  windowsClientReferenceLegacyHtml,
  /Windows client reference legacy answer/,
  'Windows client-reference legacy Exercise must keep Solution body in answer area',
);
assert.ok(
  !windowsClientReferenceLegacyHtml.includes(
    'Problem text before Windows client reference Solution.Windows client reference legacy answer',
  ),
  'Windows client-reference legacy Exercise must not inline Solution body into problem area',
);

const webpackClientReferenceLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text before webpack client reference Solution.',
    React.createElement(
      webpackClientReferenceSolution,
      null,
      'Webpack client reference legacy answer',
    ),
  ),
);
assert.doesNotMatch(
  webpackClientReferenceLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'webpack client-reference legacy Exercise must not require Hint',
);
assert.match(
  webpackClientReferenceLegacyHtml,
  /Webpack client reference legacy answer/,
  'webpack client-reference legacy Exercise must keep Solution body in answer area',
);

const rscBundledClientReferenceLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text before RSC bundled client reference Solution.',
    React.createElement(
      rscBundledClientReferenceSolution,
      null,
      'RSC bundled client reference legacy answer',
    ),
  ),
);
assert.doesNotMatch(
  rscBundledClientReferenceLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'RSC bundled client-reference legacy Exercise must not require Hint',
);
assert.match(
  rscBundledClientReferenceLegacyHtml,
  /RSC bundled client reference legacy answer/,
  'RSC bundled client-reference legacy Exercise must keep Solution body in answer area',
);

const opaqueBundledClientReferenceLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text before opaque bundled client reference Solution.',
    React.createElement(
      opaqueBundledClientReferenceSolution,
      null,
      'Opaque bundled client reference legacy answer',
    ),
  ),
);
assert.doesNotMatch(
  opaqueBundledClientReferenceLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'opaque bundled client-reference legacy Exercise must not require Hint',
);
assert.match(
  opaqueBundledClientReferenceLegacyHtml,
  /Opaque bundled client reference legacy answer/,
  'opaque bundled client-reference legacy Exercise must keep Solution body in answer area',
);

const clientReferenceLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text before client reference Solution.',
    React.createElement(
      clientReferenceSolution,
      null,
      'Client reference legacy answer',
    ),
  ),
);
assert.doesNotMatch(
  clientReferenceLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'client-reference legacy Exercise must not require Hint',
);
assert.match(
  clientReferenceLegacyHtml,
  /Problem text before client reference Solution\./,
  'client-reference legacy Exercise must keep textual problem content',
);
assert.match(
  clientReferenceLegacyHtml,
  /Client reference legacy answer/,
  'client-reference legacy Exercise must keep Solution body in answer area',
);
assert.ok(
  !clientReferenceLegacyHtml.includes(
    'Problem text before client reference Solution.Client reference legacy answer',
  ),
  'client-reference legacy Exercise must not inline Solution body into problem area',
);

assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    problem,
    React.createElement(
      clientReferenceSolution,
      null,
      'Client reference legacy answer',
    ),
  ),
  /QuickCheck does not allow legacy Solution/,
  'QuickCheck should reject client-reference Solution',
);

assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    problem,
    React.createElement(
      opaqueBundledClientReferenceSolution,
      null,
      'Opaque bundled legacy answer',
    ),
  ),
  /QuickCheck does not allow legacy Solution/,
  'QuickCheck should reject opaque bundled client-reference Solution',
);

const rscBundledClientReferenceQuickCheckHtml = renderToString(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem before RSC bundled client references.',
    React.createElement(
      rscBundledClientReferenceHint,
      null,
      'RSC bundled client reference hint',
    ),
    React.createElement(
      rscBundledClientReferenceAnswer,
      null,
      'RSC bundled client reference answer',
    ),
  ),
);
assert.match(
  rscBundledClientReferenceQuickCheckHtml,
  /QuickCheck problem before RSC bundled client references\./,
  'QuickCheck should render problem content before RSC bundled Hint/Answer refs',
);
assert.match(
  rscBundledClientReferenceQuickCheckHtml,
  /RSC bundled client reference hint/,
  'QuickCheck should render RSC bundled client-reference Hint content',
);
assert.match(
  rscBundledClientReferenceQuickCheckHtml,
  /RSC bundled client reference answer/,
  'QuickCheck should render RSC bundled client-reference Answer content',
);

const opaqueBundledClientReferenceQuickCheckHtml = renderToString(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem before opaque bundled client references.',
    React.createElement(
      opaqueBundledClientReferenceHint,
      null,
      'Opaque bundled client reference hint',
    ),
    React.createElement(
      opaqueBundledClientReferenceAnswer,
      null,
      'Opaque bundled client reference answer',
    ),
  ),
);
assert.match(
  opaqueBundledClientReferenceQuickCheckHtml,
  /QuickCheck problem before opaque bundled client references\./,
  'QuickCheck should render problem content before opaque bundled Hint/Answer refs',
);
assert.match(
  opaqueBundledClientReferenceQuickCheckHtml,
  /Opaque bundled client reference hint/,
  'QuickCheck should render opaque bundled client-reference Hint content',
);
assert.match(
  opaqueBundledClientReferenceQuickCheckHtml,
  /Opaque bundled client reference answer/,
  'QuickCheck should render opaque bundled client-reference Answer content',
);

assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem before non-matching Hint export.',
    React.createElement(
      createClientReference('some-bundled-id#NotHint'),
      null,
      'Wrong hint export body',
    ),
    React.createElement(
      opaqueBundledClientReferenceAnswer,
      null,
      'Answer still detected',
    ),
  ),
  /at least one Hint is required/,
  'non-Hint bundled export should not be treated as Hint',
);
assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem before non-matching Answer export.',
    React.createElement(
      createClientReference('some-bundled-id#NotAnswer'),
      null,
      'Wrong answer export body',
    ),
    React.createElement(
      opaqueBundledClientReferenceHint,
      null,
      'Hint still detected',
    ),
  ),
  /exactly one Answer is required/,
  'non-Answer bundled export should not be treated as Answer',
);
assertStructureError(
  React.createElement(
    Exercise,
    null,
    problem,
    React.createElement(
      createClientReference('some-bundled-id#NotSolution'),
      null,
      'Wrong export body',
    ),
  ),
  /at least one Hint is required/,
  'non-Solution bundled export should not be treated as legacy Solution',
);

assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem without new-format children.',
    React.createElement(
      UndetectableLegacySolution,
      null,
      'Undetectable QuickCheck legacy answer',
    ),
  ),
  /at least one Hint is required/,
  'QuickCheck should not enter legacy context-registration mode',
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

// Site MDX/SSR regression: legacy Exercise with textual problem + Solution
// content (the exact failure shape that motivated this fix) must render
// without Hint and must not leak solution body into problem content. We
// must hit the SSR rendering path because the prior marker fix only
// covered the client-side evaluate-as-function shape and not real
// MDX/SSR builds where React renders the legacy Solution component.
const siteLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem statement as plain MDX text.',
    React.createElement(Solution, null, 'Legacy answer body'),
  ),
);
assert.doesNotMatch(
  siteLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'site-MDX legacy Exercise must not require Hint',
);
assert.match(
  siteLegacyHtml,
  /Problem statement as plain MDX text\./,
  'site-MDX legacy Exercise must keep textual problem content',
);
assert.match(
  siteLegacyHtml,
  /Legacy answer body/,
  'site-MDX legacy Exercise must keep answer body in answer area',
);
assert.ok(
  !siteLegacyHtml.includes(
    'rensyuNaiyou">Problem statement as plain MDX text.Legacy answer body',
  ),
  'site-MDX legacy Exercise must not inline solution body into problem area',
);

// Site MDX/SSR regression: Solution wrapped in a React Fragment (a real
// MDX/SSR artifact between <Exercise> and <Solution>). This emulates the
// failure where pre-render validation sees the Solution children as
// additional "problem content" children producing
//   "Actual order: problem content > problem content"
// even though the legacy Solution is intended.
const fragmentWrappedLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    React.createElement(
      'p',
      null,
      'Problem statement wrapped together with the legacy Solution.',
    ),
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Solution, null, 'Legacy answer in a Fragment'),
    ),
  ),
);
assert.match(
  fragmentWrappedLegacyHtml,
  /Problem statement wrapped together with the legacy Solution\./,
  'Fragment-wrapped legacy Exercise must keep textual problem content',
);
assert.match(
  fragmentWrappedLegacyHtml,
  /Legacy answer in a Fragment/,
  'Fragment-wrapped legacy Exercise must keep answer body in answer area',
);
assert.doesNotMatch(
  fragmentWrappedLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'Fragment-wrapped legacy Exercise must not require Hint',
);
assert.ok(
  !fragmentWrappedLegacyHtml.includes(
    'Legacy answer in a FragmentProblem statement',
  ) &&
    !fragmentWrappedLegacyHtml.includes(
      'Problem statement wrapped together with the legacy Solution.Legacy answer',
    ),
  'Fragment-wrapped legacy Exercise must not inline solution body into problem area',
);

// Site MDX/SSR regression: deeply nested Fragment wrappers around Solution.
// Real MDX layouts sometimes wrap children in nested wrapper elements
// (MDX layouts, theme providers, etc.). GuidedTask must still locate the
// legacy Solution through the chain.
const deeplyWrappedLegacyHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Problem text for deeply nested legacy fixture.',
    React.createElement(
      React.Fragment,
      null,
      React.createElement(
        React.Fragment,
        null,
        React.createElement(
          React.Fragment,
          null,
          React.createElement(Solution, null, 'Deeply nested legacy answer'),
        ),
      ),
    ),
  ),
);
assert.match(
  deeplyWrappedLegacyHtml,
  /Deeply nested legacy answer/,
  'deeply nested Fragment-wrapped legacy Exercise must keep answer body in answer area',
);
assert.match(
  deeplyWrappedLegacyHtml,
  /Problem text for deeply nested legacy fixture\./,
  'deeply nested Fragment-wrapped legacy Exercise must keep textual problem content',
);
assert.ok(
  !deeplyWrappedLegacyHtml.includes(
    'Problem text for deeply nested legacy fixture.Deeply nested legacy answer',
  ),
  'deeply nested Fragment-wrapped legacy must not bleed answer into problem area',
);
assert.doesNotMatch(
  deeplyWrappedLegacyHtml,
  /\u30d2\u30f3\u30c8\u3092\u898b\u308b/,
  'deeply nested Fragment-wrapped legacy Exercise must not require Hint',
);

assertStructureError(
  React.createElement(
    Exercise,
    null,
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Hint, null, 'Mixed hint'),
      React.createElement(Solution, null, 'Mixed legacy'),
    ),
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
  'Hint wrapped in Fragment alongside a Solution must still be rejected',
);

assertStructureError(
  React.createElement(
    Exercise,
    null,
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Solution, null, 'first'),
      React.createElement(Solution, null, 'second'),
    ),
  ),
  /legacy Exercise requires exactly one Solution/,
  'multiple legacy Solutions inside one Fragment must be rejected',
);

// QuickCheck must never accept legacy Solution even if it bypasses the
// Solution wrapper through a Fragment (real MDX layouts may wrap either
// Solution or QuickCheck directly).
assertStructureError(
  React.createElement(
    QuickCheck,
    null,
    'Problem statement',
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Solution, null, 'Legacy answer in fragment'),
    ),
  ),
  /QuickCheck does not allow legacy Solution/,
  'QuickCheck should reject Fragment-wrapped Solution',
);

// Mixed new/legacy (Hint before legacy Solution) must still reject even
// when wrapped in Fragment artifacts. This protects the final new-format
// validation from being weakened by the deep-scan fallback.
assertStructureError(
  React.createElement(
    Exercise,
    null,
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Hint, null, 'some hint'),
      React.createElement(Solution, null, 'legacy after hint'),
    ),
  ),
  /legacy Solution cannot be mixed with Hint or Answer/,
  'Hint-then-Solution inside Fragment must still be rejected (mixed new/legacy)',
);

assertStructureError(
  React.createElement(
    Exercise,
    null,
    React.createElement(
      React.Fragment,
      null,
      React.createElement(Solution, null, 'legacy answer'),
      React.createElement(Solution, null, 'second legacy answer'),
    ),
  ),
  /legacy Exercise requires exactly one Solution/,
  'two Solutions inside one Fragment must be rejected',
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
assert.throws(
  () =>
    renderToString(
      React.createElement(
        Exercise,
        null,
        'Problem before undetectable mixed legacy Solution.',
        React.createElement(
          UndetectableLegacySolution,
          null,
          'Undetectable mixed legacy answer',
        ),
        hint,
        answer,
      ),
    ),
  /legacy Solution cannot be mixed with Hint or Answer/,
  'undetectable legacy Solution should still reject mixed new-format Exercise',
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
      null,
      'Problem text before undetectable legacy Solution.',
      React.createElement(
        UndetectableLegacySolution,
        null,
        'Undetectable legacy answer body',
      ),
    ),
  );
});
await act(async () => {});

assert.match(
  root.querySelector('.rensyuNaiyou')?.textContent ?? '',
  /Problem text before undetectable legacy Solution\./,
  'undetectable legacy fallback should keep problem content',
);
assert.doesNotMatch(
  root.querySelector('.rensyuNaiyou')?.textContent ?? '',
  /Undetectable legacy answer body/,
  'undetectable legacy fallback must not render answer in problem area',
);
assert.match(
  root.querySelector('.rensyuKaitouNaiyou')?.textContent ?? '',
  /Undetectable legacy answer body/,
  'undetectable legacy fallback should register answer content',
);
assert.equal(
  root.querySelectorAll('.rensyuHint').length,
  0,
  'undetectable legacy fallback should not require Hint',
);

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
