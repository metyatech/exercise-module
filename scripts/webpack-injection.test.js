import assert from 'node:assert/strict';
import exercisePlugin from '../dist/plugin.js';
import remarkExerciseHeadings from '../dist/remark/exerciseHeadings.js';

const plugin = exercisePlugin({}, {headingLevel: 4});

const config = {
  module: {
    rules: [
      {
        use: [
          {
            loader: '@docusaurus/mdx-loader',
            options: {
              remarkPlugins: [remarkExerciseHeadings],
              beforeDefaultRemarkPlugins: [],
            },
          },
        ],
      },
    ],
  },
};

plugin.configureWebpack(config);

const useOptions = config.module.rules[0].use[0].options;
const beforeList = useOptions.beforeDefaultRemarkPlugins;

assert.ok(Array.isArray(beforeList), 'beforeDefaultRemarkPlugins should be an array');
assert.equal(beforeList.length, 1, 'should inject remark plugin');
assert.equal(beforeList[0][0], remarkExerciseHeadings, 'should inject remarkExerciseHeadings');
assert.deepEqual(beforeList[0][1], {headingLevel: 4}, 'should pass headingLevel');

const remarkPlugins = useOptions.remarkPlugins;
assert.ok(
  !remarkPlugins || !remarkPlugins.includes(remarkExerciseHeadings),
  'should remove plugin from remarkPlugins',
);

const configWithExisting = {
  module: {
    rules: [
      {
        use: [
          {
            loader: '@docusaurus/mdx-loader',
            options: {
              beforeDefaultRemarkPlugins: [[remarkExerciseHeadings, {headingLevel: 4}]],
            },
          },
        ],
      },
    ],
  },
};

plugin.configureWebpack(configWithExisting);

const existingBeforeList =
  configWithExisting.module.rules[0].use[0].options.beforeDefaultRemarkPlugins;

assert.equal(existingBeforeList.length, 1, 'should not duplicate remark plugin');

console.log('webpack-injection test passed');
