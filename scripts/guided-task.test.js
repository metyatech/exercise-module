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
import { isHintElement } from '../dist/theme/Exercise/hintDetection.js';
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

const directExerciseDom = new JSDOM(
  `<!doctype html><div id="fixture">${directAnswerHtml}</div>`,
).window.document;
const exerciseHeader = directExerciseDom.querySelector('.rensyuTaskHeader');
assert.equal(
  exerciseHeader?.textContent,
  '演習',
  'Exercise should render a compact 演習 header',
);
assert.equal(
  exerciseHeader?.querySelector('svg')?.getAttribute('data-guided-task-icon'),
  'pencil',
  'Exercise should render a pencil icon',
);
assert.doesNotMatch(
  exerciseHeader?.textContent ?? '',
  /^E$/,
  'Exercise should not add a standalone E label',
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
  /class="rensyuBlock rensyuQuickCheck"/,
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
assert.match(quickCheckHtml, /解答を見る/, 'should label QuickCheck answer');

const quickCheckDom = new JSDOM(
  `<!doctype html><div id="fixture">${quickCheckHtml}</div>`,
).window.document;
const classAttribute = (element) => element?.getAttribute('class');
const summaryShape = (summary) => [
  classAttribute(summary),
  classAttribute(summary?.children[0]),
  classAttribute(summary?.children[0]?.children[0]),
  classAttribute(summary?.children[1]),
];
const exerciseHintSummary = directExerciseDom.querySelector(
  'details.rensyuHint > summary',
);
const quickHintSummary = quickCheckDom.querySelector(
  'details.rensyuHint > summary',
);
const exerciseAnswerSummary = directExerciseDom.querySelector(
  'details.rensyuKaitou > summary',
);
const quickAnswerSummary = quickCheckDom.querySelector(
  'details.rensyuKaitou > summary',
);
assert.deepEqual(
  summaryShape(exerciseHintSummary),
  summaryShape(quickHintSummary),
  'Exercise and QuickCheck Hint summaries should share the same structure',
);
assert.deepEqual(
  summaryShape(exerciseAnswerSummary),
  summaryShape(quickAnswerSummary),
  'Exercise and QuickCheck Answer summaries should share the same structure',
);
assert.equal(
  exerciseHintSummary
    ?.querySelector('svg')
    ?.getAttribute('data-guided-task-icon'),
  'lightbulb',
  'Hint should use a lightbulb icon',
);
assert.equal(
  exerciseAnswerSummary
    ?.querySelector('svg')
    ?.getAttribute('data-guided-task-icon'),
  'checkCircle',
  'Answer should use a check-circle icon',
);
for (const icon of directExerciseDom.querySelectorAll('svg')) {
  assert.equal(
    icon.getAttribute('aria-hidden'),
    'true',
    'icons should be decorative',
  );
  assert.equal(
    icon.getAttribute('focusable'),
    'false',
    'icons should not be focusable',
  );
}
assert.equal(
  directExerciseDom.querySelectorAll('details[open]').length,
  0,
  'guided task details should be closed initially',
);

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

const createLazyClientReference = (id) => ({
  $$typeof: Symbol.for('react.lazy'),
  _payload: createClientReference(id),
  _init: (payload) => payload,
});

const assertExtractedHintAndAnswer = ({
  html,
  hintText,
  answerText,
  description,
}) => {
  const fixtureDom = new JSDOM(
    `<!doctype html><div id="fixture">${html}</div>`,
  );
  const fixture = fixtureDom.window.document.getElementById('fixture');
  assert.ok(fixture, `${description}: fixture should exist`);

  const problemAreaText =
    fixture.querySelector('.rensyuNaiyou')?.textContent ?? '';
  assert.doesNotMatch(
    problemAreaText,
    new RegExp(`${hintText}|${answerText}`),
    `${description}: Hint and Answer content should not render inline`,
  );
  assert.equal(
    fixture.querySelectorAll('details.rensyuHint').length,
    1,
    `${description}: should render one Hint details element`,
  );
  assert.equal(
    fixture.querySelector('details.rensyuHint .rensyuHintNaiyou')?.textContent,
    hintText,
    `${description}: should extract Hint content into hint details`,
  );
  assert.equal(
    fixture.querySelectorAll('details.rensyuKaitou').length,
    1,
    `${description}: should render one Answer details element`,
  );
  assert.equal(
    fixture.querySelector('details.rensyuKaitou .rensyuKaitouNaiyou')
      ?.textContent,
    answerText,
    `${description}: should extract Answer content into answer details`,
  );
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
const lazyRscBundledClientReferenceHint = createLazyClientReference(
  'webpack-internal:///(rsc)/./node_modules/.../client.js#Hint',
);
const lazyRscBundledClientReferenceAnswer = createLazyClientReference(
  'webpack-internal:///(rsc)/./node_modules/.../client.js#Answer',
);
const lazyOpaqueBundledClientReferenceHint = createLazyClientReference(
  'some-bundled-id#Hint',
);
const lazyOpaqueBundledClientReferenceAnswer = createLazyClientReference(
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

const lazyRscBundledClientReferenceQuickCheckHtml = renderToString(
  React.createElement(
    QuickCheck,
    null,
    'QuickCheck problem before lazy RSC bundled client references.',
    React.createElement(
      lazyRscBundledClientReferenceHint,
      null,
      'Lazy RSC bundled hint',
    ),
    React.createElement(
      lazyRscBundledClientReferenceAnswer,
      null,
      'Lazy RSC bundled answer',
    ),
  ),
);
assertExtractedHintAndAnswer({
  html: lazyRscBundledClientReferenceQuickCheckHtml,
  hintText: 'Lazy RSC bundled hint',
  answerText: 'Lazy RSC bundled answer',
  description: 'QuickCheck lazy RSC bundled client references',
});

const lazyOpaqueBundledClientReferenceExerciseHtml = renderToString(
  React.createElement(
    Exercise,
    null,
    'Exercise problem before lazy opaque bundled client references.',
    React.createElement(
      lazyOpaqueBundledClientReferenceHint,
      null,
      'Lazy opaque bundled hint',
    ),
    React.createElement(
      lazyOpaqueBundledClientReferenceAnswer,
      null,
      'Lazy opaque bundled answer',
    ),
  ),
);
assertExtractedHintAndAnswer({
  html: lazyOpaqueBundledClientReferenceExerciseHtml,
  hintText: 'Lazy opaque bundled hint',
  answerText: 'Lazy opaque bundled answer',
  description: 'Exercise lazy opaque bundled client references',
});

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

const opaqueRscAnswerElement = React.createElement(
  createClientReference('some-rsc-id#Answer'),
  null,
  'Opaque RSC answer',
);
assert.ok(
  isAnswerElement(opaqueRscAnswerElement),
  'opaque RSC answer should be detected as Answer',
);

const legacyAnswerExport = `${'Sol'}${'ution'}`;
const opaqueLegacyAnswerElement = React.createElement(
  createClientReference(`some-rsc-id#${legacyAnswerExport}`),
  null,
  'Opaque legacy answer',
);
assert.ok(
  !isAnswerElement(opaqueLegacyAnswerElement),
  'opaque legacy answer export should not be detected as Answer',
);

const lazyQuickCheckElement = React.createElement(
  createLazyClientReference('some-rsc-id#QuickCheck'),
  null,
  'Lazy QuickCheck body',
);
assert.ok(
  !isHintElement(lazyQuickCheckElement),
  'lazy QuickCheck export should not be detected as Hint',
);
assert.ok(
  !isAnswerElement(lazyQuickCheckElement),
  'lazy QuickCheck export should not be detected as Answer',
);

const lazyLegacyAnswerElement = React.createElement(
  createLazyClientReference(`some-rsc-id#${legacyAnswerExport}`),
  null,
  'Lazy legacy answer',
);
assert.ok(
  !isAnswerElement(lazyLegacyAnswerElement),
  'lazy legacy answer export should not be detected as Answer',
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

const hintDetails = root.querySelectorAll('details.rensyuHint');
assert.equal(hintDetails.length, 1, 'Exercise should render one Hint details');
assert.equal(
  hintDetails[0]?.querySelector('summary')?.textContent,
  'ヒントを見る',
  'single Hint details should use the expected label',
);
assert.equal(
  hintDetails[0]?.querySelector('.rensyuHintNaiyou')?.textContent,
  `Hint ${blank('hint-only')}`,
  'Hint details should render Hint content',
);
assert.equal(
  root.querySelector('.rensyuBlock')?.children[1],
  root.querySelector('.rensyuNaiyou'),
  'problem content should render before Hint details',
);
assert.equal(
  root.querySelector('.rensyuBlock')?.children[2],
  hintDetails[0],
  'Hint details should render before Answer details',
);
assert.equal(
  root.querySelector('.rensyuBlock')?.children[2]?.className,
  'rensyuHint',
  'Hint details should keep their existing class',
);
assert.equal(
  root.querySelector('.rensyuBlock')?.children[3]?.className,
  'rensyuKaitou',
  'Answer details should render after Hint details',
);
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
const detailsLayoutRule = styleText.match(
  /\.rensyuHint,\s*\.rensyuKaitou\s*\{([^}]*)\}/s,
);
const summaryLayoutRule = styleText.match(
  /\.rensyuHint > summary,\s*\.rensyuKaitou > summary\s*\{([^}]*)\}/s,
);
const contentLayoutRule = styleText.match(
  /\.rensyuHintNaiyou,\s*\.rensyuKaitouNaiyou\s*\{([^}]*)\}/s,
);
assert.ok(
  detailsLayoutRule,
  'Hint and Answer details layout rule should exist',
);
assert.ok(
  summaryLayoutRule,
  'Hint and Answer summary layout rule should exist',
);
assert.ok(
  contentLayoutRule,
  'Hint and Answer content layout rule should exist',
);
assert.match(detailsLayoutRule[1], /padding:\s*0;/);
assert.match(summaryLayoutRule[1], /padding:\s*0\.65rem\s+0\.75rem;/);
assert.match(contentLayoutRule[1], /margin:\s*0\s+0\.75rem\s+0\.75rem;/);
assert.match(
  styleText,
  /\.rensyuHint > summary:hover,\s*\.rensyuKaitou > summary:hover\s*\{/s,
  'Hint and Answer hover should target the full summary surface',
);
assert.match(styleText, /\[data-theme='dark'\] \.rensyuHint/);
assert.match(
  styleText,
  /\.rensyuBlock\.rensyuQuickCheck \{[^}]*border-top: 3px/s,
  'QuickCheck should have a lighter top accent',
);
assert.match(
  styleText,
  /\.rensyuBlock \{[^}]*border-top: 5px/s,
  'Exercise should have a stronger top accent',
);
assert.doesNotMatch(styleText, /linear-gradient/);
assert.doesNotMatch(styleText, /content:\s*['"](?:💪|▶)/);

await act(async () => {
  reactRoot.unmount();
});

const quickCheckRoot = createRoot(root);
await act(async () => {
  quickCheckRoot.render(
    React.createElement(
      QuickCheck,
      { enableBlanks: true },
      React.createElement('p', null, `Quick ${blank('beta')}`),
      React.createElement(Hint, null, 'Quick hint'),
      React.createElement(Answer, null, 'Quick answer'),
    ),
  );
});

const renderedQuickCheck = root.querySelector('.rensyuBlock.rensyuQuickCheck');
assert.ok(renderedQuickCheck, 'QuickCheck should render quickcheck modifier');
assert.equal(
  root.querySelector('.rensyuQuickCheckTitle')?.textContent,
  '理解度確認',
  'QuickCheck should render title element',
);
assert.equal(
  root.querySelectorAll('.rensyuNaiyou .rensyuBlankInput').length,
  1,
  'enableBlanks should apply inputs to QuickCheck problem area',
);
assert.ok(
  !root.querySelector('.rensyuNaiyou')?.textContent?.includes('${'),
  'QuickCheck problem placeholders should be replaced',
);
assert.equal(
  root.querySelectorAll('.rensyuKaitouNaiyou .rensyuBlankTag').length,
  1,
  'QuickCheck Answer area should include auto answer tags',
);

await act(async () => {
  quickCheckRoot.unmount();
});

console.log('guided-task test passed');
