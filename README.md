# @metyatech/exercise

A Docusaurus plugin and MDX components for exercise blocks with optional solutions,
automatic TOC headings, and fill-in-the-blank placeholders.

## Features

- Styled Exercise block with a title and content area.
- Optional collapsible Solution section.
- Exercise titles are registered in the Table of Contents via a remark plugin.
- Optional fill-in-the-blank inputs using `${answer}` placeholders.
- Client-side styles injected once with light/dark support.

## Setup

### Installation

```bash
npm install @metyatech/exercise
```

### Configuration

Add the plugin to `docusaurus.config.ts`. The `headingLevel` option controls the
TOC heading level for exercise titles (default: `2`, range: `2-6`).

```ts
import type {Config} from '@docusaurus/types';

const config: Config = {
  // ...existing config...
  plugins: [
    [
      '@metyatech/exercise',
      {
        headingLevel: 2,
      },
    ],
  ],
};

export default config;
```

Import client components from each MDX file:

```mdx
import Exercise, { Solution } from '@metyatech/exercise/client';
```

## Usage

### Basic Exercise + Solution

```mdx
import Exercise, { Solution } from '@metyatech/exercise/client';

<Exercise title="Change the box color">
Write the instructions here.

<Solution>
Write hints or sample solutions here.
</Solution>
</Exercise>
```

If you omit `Solution`, the collapsible solution block is not rendered.

### Custom solution label

```mdx
<Exercise title="Check your steps" solutionTitle="Show hint">
You can also show step-by-step text only.
</Exercise>
```

`solutionTitle` defaults to a Japanese label; set it if you need another language.

### Fill-in-the-blank inputs

Enable placeholders with `enableBlanks`. Use `${answer}` in the exercise body,
and optionally in the solution.

```mdx
<Exercise title="CSS opacity" enableBlanks>
Set `opacity: ${alpha};` in the CSS rule.

<Solution>
The correct value is `${alpha}`.
</Solution>
</Exercise>
```

When `enableBlanks` is on:

- Placeholders in the exercise body become input fields.
- Placeholders in the solution become labeled tags.
- If the solution has no placeholders, answers from the exercise body are listed automatically.

## Component Props

### Exercise

- `title` (required): Exercise title.
- `solutionTitle`: Label for the solution toggle.
- `enableBlanks`: Enable placeholder processing (default: `false`).
- `headingId`: Used by the plugin to link TOC headings.
- `headingLevel`: Used by the plugin to control the heading tag.

### Solution

- `children` (required): Content to show when expanded.

## Styling

Styles are injected on the client side once. If you need to override them,
target the class names (e.g. `rensyuBlock`, `rensyuKaitou`) in your site CSS
or swizzle the `@theme/Exercise` component.

## Development Commands

- `npm run build`: build
- `npm run test`: build + node tests
- `npm run lint`: typecheck

## Environment Variables/Settings

None.

## Release/Deploy

```bash
npm publish
```
