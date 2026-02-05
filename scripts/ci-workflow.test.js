import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflowPath = '.github/workflows/ci.yml';
const yaml = fs.readFileSync(workflowPath, 'utf8');
const lines = yaml.split(/\r?\n/);

let sawWithBlock = false;
let sawRunStep = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i] ?? '';

  const withMatch = /^(\s*)with:\s*$/.exec(line);
  if (!withMatch) continue;

  sawWithBlock = true;
  const withIndent = withMatch[1]?.length ?? 0;

  for (let j = i + 1; j < lines.length; j++) {
    const nextLine = lines[j] ?? '';
    const nextIndent = /^\s*/.exec(nextLine)?.[0]?.length ?? 0;

    if (nextLine.trim() === '') continue;
    if (nextIndent <= withIndent) break;

    if (/^\s*-\s*run:/.test(nextLine)) {
      assert.fail(
        `${workflowPath} has a '- run:' step nested under 'with:' (line ${
          j + 1
        })`,
      );
    }
  }
}

for (const line of lines) {
  if (/^\s*-\s*run:/.test(line)) {
    sawRunStep = true;
    break;
  }
}

assert.ok(sawWithBlock, `${workflowPath} should include a 'with:' block`);
assert.ok(
  sawRunStep,
  `${workflowPath} should include at least one '- run:' step`,
);

console.log('ci-workflow structure test passed');
