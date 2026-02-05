import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  OptionValidationContext,
  Plugin,
} from '@docusaurus/types';

export type ExercisePluginOptions = Record<string, never>;

export default function exercisePlugin(): Plugin {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const themePath = path.resolve(currentDir, './theme');

  return {
    name: '@metyatech/docusaurus-plugin-exercise',
    getThemePath() {
      return themePath;
    },
    getTypeScriptThemePath() {
      return themePath;
    },
  };
}

export function validateOptions({
  options,
}: OptionValidationContext<
  ExercisePluginOptions,
  ExercisePluginOptions
>): ExercisePluginOptions {
  return options ?? {};
}
