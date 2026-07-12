# @metyatech/exercise

A Docusaurus plugin and MDX components for guided exercise blocks with hints,
answers, quick checks, and fill-in-the-blank placeholders.

## Features

- Styled `Exercise` block with a problem area, one or more hints, and an answer.
- Lightweight `QuickCheck` block for short comprehension checks.
- Collapsible native `details`/`summary` sections for hints and answers.
- Optional fill-in-the-blank inputs using `${answer}` placeholders.
- Client-side styles injected once with light/dark support.

## Setup

### Installation

```bash
npm install @metyatech/exercise
```

### Configuration

Add the plugin to `docusaurus.config.ts`.

```ts
import type { Config } from '@docusaurus/types';

const config: Config = {
  // ...existing config...
  plugins: ['@metyatech/exercise'],
};

export default config;
```

Import client components from each MDX file:

```mdx
import Exercise, { Answer, Hint, QuickCheck } from '@metyatech/exercise/client';
```

## Usage

### Exercise with hints and an answer

```mdx
import Exercise, { Answer, Hint } from '@metyatech/exercise/client';

## Change the box color

<Exercise>
Write the instructions here.

<Hint>Look for the CSS property that changes the background.</Hint>

<Answer>
Use `background-color` with the desired color value.
</Answer>
</Exercise>
```

`Exercise` requires problem content, at least one `Hint`, and exactly one
`Answer` in that order. A single hint is labeled `ヒントを見る`; multiple hints
are labeled `ヒント1`, `ヒント2`, and so on. The answer summary defaults to
`解答を見る`.

### QuickCheck

Use `QuickCheck` for shorter checks. It uses the same child structure as
`Exercise`, but the answer summary defaults to `答えを見る`.

```mdx
import { Answer, Hint, QuickCheck } from '@metyatech/exercise/client';

<QuickCheck>
Which CSS property controls transparency?

<Hint>It accepts values from `0` to `1`.</Hint>

<Answer>
Use `opacity`.
</Answer>
</QuickCheck>
```

### Custom answer label

```mdx
<Exercise answerTitle="Show answer">
  Read the code and predict the output.

<Hint>Trace the variable assignment first.</Hint>

  <Answer>The final value is `3`.</Answer>
</Exercise>
```

`answerTitle` changes the answer toggle label.

### Fill-in-the-blank inputs

Enable placeholders with `enableBlanks`. Use `${answer}` in the problem body;
placeholders in `Hint` are ignored, and placeholders in `Answer` become answer
tags. If the answer has no placeholders, answers from the problem body are
listed automatically in the answer area.

```mdx
## CSS opacity

<Exercise enableBlanks>
Set `opacity: ${alpha};` in the CSS rule.

<Hint>The value is between `0` and `1`.</Hint>

<Answer>
The correct value is `${alpha}`.
</Answer>
</Exercise>
```

## Component Props

### Exercise

- `children` (required): Problem content, one or more `Hint` children, and one
  `Answer` child.
- `answerTitle`: Label for the answer toggle (default: `解答を見る`).
- `enableBlanks`: Enable placeholder processing (default: `false`).

### QuickCheck

- `children` (required): Problem content, one or more `Hint` children, and one
  `Answer` child.
- `answerTitle`: Label for the answer toggle (default: `答えを見る`).
- `quickCheckTitle`: Small heading shown above the problem (default:
  `Quick Check`).
- `enableBlanks`: Enable placeholder processing (default: `false`).

### Hint

- `children` (required): Hint content to show when expanded.

### Answer

- `children` (required): Answer content to show when expanded.

## Styling

Styles are injected on the client side once. If you need to override them,
target the class names (e.g. `rensyuBlock`, `rensyuNaiyou`, `rensyuHint`,
`rensyuKaitou`) in your site CSS or swizzle the `@theme/Exercise` component.

## Development Commands

- `npm install`: Install dependencies.
- `npm run build`: Build the project.
- `npm run lint`: Run ESLint and type check.
- `npm run format`: Format code with Prettier.
- `npm test`: Run tests.
- `npm run verify`: Run lint, format check, and tests.

## AGENTS.md

This repository follows the rules defined in [AGENTS.md](./AGENTS.md).

## Environment Variables/Settings

None.

## Release/Deploy

```bash
npm publish
```

## Overview

This repository contains the exercise-module project.
