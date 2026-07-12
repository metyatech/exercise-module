import assert from 'node:assert/strict';
import React, { act } from 'react';
import { JSDOM } from 'jsdom';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import Exercise, {
  Answer,
  Hint,
  QuickCheck,
} from '../dist/theme/Exercise/index.js';
import { isAnswerElement } from '../dist/theme/Exercise/answerDetection.js';
import ClientExercise, {
  Answer as ClientAnswer,
  Hint as ClientHint,
  QuickCheck as ClientQuickCheck,
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
assert.match(
  directAnswerHtml,
  /rensyuKaitou/,
  'should keep answer details class',
);
assert.match(
  directAnswerHtml,
  /rensyuKaitouNaiyou/,
  'should keep answer content class',
);

const multipleHintsHtml = renderExercise(
  problem,
  React.createElement(Hint, null, 'Hint 1'),
  React.createElement(Hint, null, 'Hint 2'),
  answer,
);
assert.match(multipleHintsHtml, /ヒント1/, 'should number first hint');
assert.match(multipleHintsHtml, /ヒント2/, 'should number second hint');

const customAnswerTitleHtml = renderToStaticMarkup(
  React.createElement(
    Exercise,
    { answerTitle: 'Show answer' },
    problem,
    hint,
    answer,
  ),
);
assert.match(
  customAnswerTitleHtml,
  /Show answer/,
  'answerTitle should customize the answer label',
);

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
assert.match(
  quickCheckHtml,
  /理解度確認/,
  'QuickCheck should render default title',
);
assert.match(quickCheckHtml, /答えを見る/, 'should label QuickCheck answer');

const assertStructureError = (element, message, description) => {
  assert.throws(
    () => renderToStaticMarkup(element),
    (error) => {
      assert.ok(error instanceof Error, 'should throw Error');
      assert.match(error.message, message, description);
      assert.match(error.message, /Actual order:/);
      assert.match(error.message, /Expected order:/);
      return true;
    },
  );
};

const createClientReference = (id) => {
  const clientReference = () => null;
  Object.defineProperty(clientReference, '$$id', {
    value: id,
  });
  return clientReference;
};

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
  'QuickCheck should render problem content before RSC bundled Hint and Answer refs',
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

const opaqueBundledClientReferenceExerciseHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Exercise problem before opaque bundled client references.',
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
  opaqueBundledClientReferenceExerciseHtml,
  /Exercise problem before opaque bundled client references\./,
  'Exercise should render problem content before opaque bundled Hint and Answer refs',
);
assert.match(
  opaqueBundledClientReferenceExerciseHtml,
  /Opaque bundled client reference hint/,
  'Exercise should render opaque bundled client-reference Hint content',
);
assert.match(
  opaqueBundledClientReferenceExerciseHtml,
  /Opaque bundled client reference answer/,
  'Exercise should render opaque bundled client-reference Answer content',
);

assertStructureError(
  React.createElement(Exercise, null, problem, answer),
  /at least one Hint is required/,
  'Exercise without Hint should fail',
);
assertStructureError(
  React.createElement(Exercise, null, problem, hint),
  /exactly one Answer is required/,
  'Exercise without Answer should fail',
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
  'Exercise with two Answer children should fail',
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
  'Exercise should reject content after Answer',
);
assertStructureError(
  React.createElement(Exercise, null, problem, answer, hint),
  /Hint must appear before Answer/,
  'Exercise should reject Hint after Answer',
);
assertStructureError(
  React.createElement(Exercise, null, problem, hint, 'Late problem', answer),
  /problem content must appear before Hint/,
  'Exercise should reject problem content after Hint',
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
  'Exercise should reject nested guided tasks',
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
    React.createElement(Hint, null, ''),
    answer,
  ),
  /Hint content must not be empty/,
  'Exercise should reject empty Hint content',
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
  'Exercise should reject empty Answer content',
);

const preEvaluatedNewAnswer = React.createElement(Answer, null, 'New answer');
assert.ok(
  isAnswerElement(preEvaluatedNewAnswer),
  'regular Answer should be detected as a normal Answer',
);

assert.equal(
  ClientExercise,
  Exercise,
  'client default export should be Exercise',
);
assert.equal(ClientAnswer, Answer, 'client should export Answer');
assert.equal(ClientHint, Hint, 'client should export Hint');
assert.equal(ClientQuickCheck, QuickCheck, 'client should export QuickCheck');

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
