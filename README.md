# @metyatech/exercise

A Docusaurus plugin that provides collapsible Exercise/Solution sections. Exercise titles are automatically registered in the Table of Contents to reduce authoring overhead.

## Setup

### Installation

```bash
npm install @metyatech/exercise
```

## Configuration

Add the plugin to `docusaurus.config.ts`. Use `headingLevel` to adjust the heading level for exercise titles (default: `3`).

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

Write exercises as a component with optional `Solution`.

```mdx
import Exercise, { Solution } from '@metyatech/exercise/client';

<Exercise title="Change the box color">
Write the instructions here.

<Solution>
Write hints or sample solutions here.
</Solution>
</Exercise>
```

If you omit `Solution`, the collapsible solution block is not shown. Use `solutionTitle` to customize the button label.

```mdx
<Exercise title="Check your steps" solutionTitle="Show hint">
You can also show step-by-step text only.
</Exercise>
```

## Styling

Required styles are injected on the client side. Light/Dark mode is supported.

## Development Commands

- `npm run build`: build
- `npm run test`: build + tests
- `npm run lint`: typecheck

## Environment Variables/Settings

None.

## Release/Deploy

```bash
npm publish
```
