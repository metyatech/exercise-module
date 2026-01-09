import path from 'node:path';
import {fileURLToPath} from 'node:url';
import type {LoadContext, Plugin, OptionValidationContext} from '@docusaurus/types';
import utilsValidation from '@docusaurus/utils-validation';
import type {Configuration as WebpackConfiguration, RuleSetRule} from 'webpack';
import remarkExerciseHeadings from './remark/exerciseHeadings.js';

const {Joi} = utilsValidation;

export interface ExercisePluginOptions {
  /** 演習見出しのレベル（2〜6） */
  headingLevel?: number;
}

const DEFAULT_OPTIONS: Required<ExercisePluginOptions> = {
  headingLevel: 2,
};

export default function exercisePlugin(
  _context: LoadContext,
  options: ExercisePluginOptions = {},
): Plugin {
  const resolvedOptions: Required<ExercisePluginOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const themePath = path.resolve(currentDir, './theme');

  const plugin: Plugin = {
    name: '@metyatech/docusaurus-plugin-exercise',

    getThemePath() {
      return themePath;
    },

    getTypeScriptThemePath() {
      return themePath;
    },

    configureWebpack(config: WebpackConfiguration) {
      injectRemarkPlugin(config, resolvedOptions.headingLevel);
      return {};
    },
  };

  return plugin;
}

type MdxLoader = {
  loader?: string;
  options?: Record<string, unknown>;
};

function injectRemarkPlugin(config: WebpackConfiguration, headingLevel: number) {
  const pluginEntry: [typeof remarkExerciseHeadings, {headingLevel: number}] = [
    remarkExerciseHeadings,
    {headingLevel},
  ];

  const isExercisePlugin = (entry: unknown): boolean => {
    if (!entry) {
      return false;
    }
    if (Array.isArray(entry)) {
      return entry[0] === remarkExerciseHeadings;
    }
    return entry === remarkExerciseHeadings;
  };

  let injected = false;

  const visitRule = (rule: RuleSetRule) => {
    if (Array.isArray(rule.oneOf)) {
      rule.oneOf.filter(Boolean).forEach((child) => visitRule(child as RuleSetRule));
    }
    if (Array.isArray(rule.rules)) {
      rule.rules.filter(Boolean).forEach((child) => visitRule(child as RuleSetRule));
    }

    const uses = rule.use;
    if (!uses) {
      return;
    }

    const useEntries = Array.isArray(uses) ? uses : [uses];

    useEntries.forEach((use) => {
      if (typeof use === 'string' || typeof use === 'function') {
        return;
      }

      const loader = (use as MdxLoader).loader;
      const isMdxLoader =
        typeof loader === 'string' &&
        (loader.includes('@docusaurus/mdx-loader') || loader.includes('@docusaurus\\mdx-loader'));

      if (!isMdxLoader) {
        return;
      }

      const originalOptions = ((use as MdxLoader).options ??= {});
      const updatedOptions: Record<string, unknown> = {
        ...originalOptions,
      };

      const remarkListRaw = (updatedOptions as any).remarkPlugins;
      const remarkList = Array.isArray(remarkListRaw)
        ? [...remarkListRaw]
        : remarkListRaw
          ? [remarkListRaw]
          : [];
      const cleanedRemarkList = remarkList.filter((entry) => !isExercisePlugin(entry));
      if (cleanedRemarkList.length !== remarkList.length) {
        updatedOptions.remarkPlugins = cleanedRemarkList;
      }

      const beforeListRaw = (updatedOptions as any).beforeDefaultRemarkPlugins;
      const beforeList = Array.isArray(beforeListRaw)
        ? [...beforeListRaw]
        : beforeListRaw
          ? [beforeListRaw]
          : [];
      const alreadyInBeforeList = beforeList.some((entry) => isExercisePlugin(entry));
      if (!alreadyInBeforeList) {
        beforeList.push(pluginEntry);
        updatedOptions.beforeDefaultRemarkPlugins = beforeList;
      }

      // 追加済みだった場合でも、remarkPlugins から重複を取り除いた可能性がある
      if (!alreadyInBeforeList || cleanedRemarkList.length !== remarkList.length) {
        delete updatedOptions.processors;
        delete updatedOptions.crossCompilerCache;
        (use as MdxLoader).options = updatedOptions;

        const beforeCount = beforeList.length;
        const remarkCount = Array.isArray(updatedOptions.remarkPlugins)
          ? (updatedOptions.remarkPlugins as unknown[]).length
          : cleanedRemarkList.length;
        console.log('[exercise plugin] 演習 heading 用 remark プラグインを前段に登録しました', {
          beforeDefaultRemarkPluginsCount: beforeCount,
          remarkPluginsCount: remarkCount,
        });
      }

      injected = injected || alreadyInBeforeList || beforeList.length > 0;
    });
  };

  if (config.module?.rules) {
    config.module.rules.forEach((rule) => {
      if (typeof rule === 'function') {
        return;
      }
      visitRule(rule as RuleSetRule);
    });
  }

  if (!injected) {
    console.warn('[exercise plugin] @docusaurus/mdx-loader が見つからなかったため、演習見出し用のremarkプラグインを追加できませんでした。');
  }
}

export function validateOptions({
  options,
  validate,
}: OptionValidationContext<
  ExercisePluginOptions,
  ExercisePluginOptions
>): ExercisePluginOptions {
  const schema = Joi.object<ExercisePluginOptions>({
    headingLevel: Joi.number().integer().min(2).max(6).default(2),
  });

  return validate(schema, options);
}
