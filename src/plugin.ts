import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {LoadContext, OptionValidationContext, Plugin} from '@docusaurus/types';

export interface ExercisePluginOptions {}

export default function exercisePlugin(
  _context: LoadContext,
  _options: ExercisePluginOptions = {},
): Plugin {
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
