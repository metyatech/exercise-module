import assert from 'node:assert/strict';
import remarkExerciseHeadings from '../dist/remark/exerciseHeadings.js';

function createExerciseNode(title, extraAttributes = []) {
  const attributes = [...extraAttributes];
  if (typeof title === 'string') {
    attributes.unshift({
      type: 'mdxJsxAttribute',
      name: 'title',
      value: title,
    });
  }
  return {
    type: 'mdxJsxFlowElement',
    name: 'Exercise',
    attributes,
  };
}

const tree = {
  type: 'root',
  children: [
    createExerciseNode('Repeat', [
      {type: 'mdxJsxAttribute', name: 'headingId', value: 'custom-id'},
      {type: 'mdxJsxAttribute', name: 'headingLevel', value: 4},
    ]),
    {
      type: 'paragraph',
      children: [{type: 'text', value: 'Between'}],
    },
    createExerciseNode('Repeat'),
    createExerciseNode(undefined),
  ],
};

const transformer = remarkExerciseHeadings({headingLevel: 5});
transformer(tree);

const children = tree.children;
const headingNodes = children.filter((node) => node.type === 'heading');

assert.equal(headingNodes.length, 2, 'should insert headings for exercises with titles');
assert.equal(headingNodes[0].depth, 5);
assert.equal(headingNodes[1].depth, 5);

assert.equal(headingNodes[0].data?.hProperties?.id, 'repeat');
assert.equal(headingNodes[1].data?.hProperties?.id, 'repeat-1');
assert.equal(headingNodes[0].data?.hProperties?.className, 'exerciseHeadingAnchor');
assert.equal(headingNodes[1].data?.hProperties?.className, 'exerciseHeadingAnchor');

assert.deepEqual(
  children.map((node) => node.type),
  [
    'heading',
    'mdxJsxFlowElement',
    'paragraph',
    'heading',
    'mdxJsxFlowElement',
    'mdxJsxFlowElement',
  ],
  'should insert heading nodes before each exercise',
);

const firstExercise = children[1];
const secondExercise = children[4];
const thirdExercise = children[5];

const firstHeadingIdAttributes = firstExercise.attributes.filter(
  (attribute) => attribute.name === 'headingId',
);
assert.equal(firstHeadingIdAttributes.length, 1, 'should not duplicate headingId');
assert.equal(firstHeadingIdAttributes[0].value, 'custom-id');

const firstHeadingLevelAttributes = firstExercise.attributes.filter(
  (attribute) => attribute.name === 'headingLevel',
);
assert.equal(firstHeadingLevelAttributes.length, 1, 'should keep existing headingLevel');
assert.equal(firstHeadingLevelAttributes[0].value, 4);

const secondHeadingIdAttributes = secondExercise.attributes.filter(
  (attribute) => attribute.name === 'headingId',
);
assert.equal(secondHeadingIdAttributes.length, 1, 'should add headingId');
assert.equal(secondHeadingIdAttributes[0].value, 'repeat-1');

const secondHeadingLevelAttributes = secondExercise.attributes.filter(
  (attribute) => attribute.name === 'headingLevel',
);
assert.equal(secondHeadingLevelAttributes.length, 1, 'should add headingLevel');
assert.equal(secondHeadingLevelAttributes[0].value, 5);

const thirdHeadingIdAttributes = thirdExercise.attributes.filter(
  (attribute) => attribute.name === 'headingId',
);
assert.equal(
  thirdHeadingIdAttributes.length,
  0,
  'should not add headingId when title is missing',
);

console.log('remark-headings test passed');
