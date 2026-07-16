import React, {
  Children,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from 'react';
import { type AnswerProps } from './Answer.js';
import { isAnswerElement } from './answerDetection.js';
import { startBlankPlaceholderObserver } from './blanks.js';
import { exerciseClasses as classes } from './classes.js';
import {
  markExerciseComponent,
  matchesMarkedComponentType,
} from './componentMarkers.js';
import { type HintProps } from './Hint.js';
import { isHintElement } from './hintDetection.js';

const STYLE_ELEMENT_ID = 'metyatech-exercise-style';
const GUIDED_TASK_COMPONENT_NAME = 'GuidedTask';

const stylesText = `
.${classes.section} {
  background-color: var(--ifm-background-surface-color, var(--ifm-background-color));
  border: 1px solid var(--ifm-color-emphasis-300);
  border-top: 5px solid var(--ifm-color-primary);
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.1);
  box-shadow: 0 4px 12px color-mix(in srgb, #0f172a 10%, transparent);
  position: relative;
  max-width: 100%;
  min-width: 0;
}

.${classes.section}.${classes.quickCheck} {
  background-color: var(--ifm-background-color);
  border: 1px solid var(--ifm-color-emphasis-300);
  border-top: 3px solid var(--ifm-color-primary-light);
  border-radius: 14px;
  box-shadow: none;
  padding: 1rem;
  margin: 1.25rem 0;
}

[data-theme='dark'] .${classes.section} {
  background-color: var(--ifm-background-surface-color, var(--ifm-background-color));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.26);
  box-shadow: 0 4px 12px color-mix(in srgb, #000 26%, transparent);
}

[data-theme='dark'] .${classes.section}.${classes.quickCheck} {
  background-color: var(--ifm-background-color);
  box-shadow: none;
}

.${classes.taskHeader} {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  color: var(--ifm-color-emphasis-700);
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.4;
}

.${classes.taskHeaderIcon} {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
  color: var(--ifm-color-primary);
}

.${classes.quickCheckTitle} {
  color: var(--ifm-color-emphasis-700);
  font-size: 0.875rem;
  font-weight: 600;
}

[data-theme='dark'] .${classes.taskHeader},
[data-theme='dark'] .${classes.quickCheckTitle} {
  color: var(--ifm-color-emphasis-700);
}

.${classes.content} {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.${classes.content} > * {
  min-width: 0;
}

.${classes.section} .prism-code {
  border: 1px solid var(--ifm-color-primary-lighter);
  background: var(--ifm-pre-background, var(--ifm-background-color));
  width: 100%;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: auto;
}

[data-theme='dark'] .${classes.section} .prism-code {
  background: rgba(0, 0, 0, 0.3);
  border-color: var(--ifm-color-primary-darker);
}

.${classes.section} .prism-code code {
  white-space: pre;
}

.${classes.section} ol,
.${classes.section} ul {
  background-color: transparent;
  border-radius: 0;
}

.${classes.hint},
.${classes.solution} {
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: 12px;
  padding: 0 0.75rem;
  margin: 1rem 0 0;
  background-color: var(--ifm-background-surface-color, var(--ifm-background-color));
  box-shadow: none;
  min-width: 0;
  overflow: hidden;
}

.${classes.hint} {
  border-color: var(--ifm-color-warning, #b45309);
  background-color: rgba(245, 158, 11, 0.035);
  background-color: color-mix(in srgb, var(--ifm-color-warning, #b45309) 4%, var(--ifm-background-surface-color, var(--ifm-background-color)));
}

.${classes.solution} {
  border-color: var(--ifm-color-success, #0f766e);
  background-color: rgba(13, 148, 136, 0.035);
  background-color: color-mix(in srgb, var(--ifm-color-success, #0f766e) 4%, var(--ifm-background-surface-color, var(--ifm-background-color)));
}

.${classes.hint}[open] {
  background-color: rgba(245, 158, 11, 0.07);
  background-color: color-mix(in srgb, var(--ifm-color-warning, #b45309) 7%, var(--ifm-background-surface-color, var(--ifm-background-color)));
}

.${classes.solution}[open] {
  background-color: rgba(13, 148, 136, 0.07);
  background-color: color-mix(in srgb, var(--ifm-color-success, #0f766e) 7%, var(--ifm-background-surface-color, var(--ifm-background-color)));
}

.${classes.hint} > summary,
.${classes.solution} > summary {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  list-style: none;
  color: var(--ifm-color-emphasis-800);
  cursor: pointer;
  margin: 0;
  padding: 0.65rem 0;
  min-width: 0;
  line-height: 1.45;
}

.${classes.hint} > summary::-webkit-details-marker,
.${classes.solution} > summary::-webkit-details-marker {
  display: none;
}

.${classes.hint} > summary::marker,
.${classes.solution} > summary::marker {
  content: '';
  display: none;
}

.${classes.summaryLabel} {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: anywhere;
}

.${classes.summaryLabel} > span {
  min-width: 0;
  overflow-wrap: anywhere;
}

.${classes.summaryIcon},
.${classes.summaryChevron} {
  width: 1.1rem;
  height: 1.1rem;
  flex: 0 0 auto;
}

.${classes.hint} .${classes.summaryIcon} {
  color: var(--ifm-color-warning, #b45309);
}

.${classes.solution} .${classes.summaryIcon} {
  color: var(--ifm-color-success, #0f766e);
}

.${classes.summaryChevron} {
  margin-left: auto;
  color: var(--ifm-color-emphasis-600);
  transition: transform 0.2s ease;
}

.${classes.hint}[open] .${classes.summaryChevron},
.${classes.solution}[open] .${classes.summaryChevron} {
  transform: rotate(90deg);
}

.${classes.hint} > summary:hover,
.${classes.solution} > summary:hover {
  background-color: color-mix(in srgb, var(--ifm-color-emphasis-100) 55%, transparent);
}

.${classes.hint} > summary:focus-visible,
.${classes.solution} > summary:focus-visible {
  outline: 2px solid var(--ifm-color-primary);
  outline-offset: 3px;
}

.${classes.hintContent},
.${classes.solutionContent} {
  min-width: 0;
  margin: 0 0 0.75rem;
  padding: 0.75rem 0 0 1.6rem;
  border-top: 1px solid var(--ifm-color-emphasis-300);
  overflow-wrap: anywhere;
}

.${classes.hintContent} {
  border-top-color: color-mix(in srgb, var(--ifm-color-warning, #b45309) 35%, var(--ifm-color-emphasis-300));
}

.${classes.solutionContent} {
  border-top-color: color-mix(in srgb, var(--ifm-color-success, #0f766e) 35%, var(--ifm-color-emphasis-300));
}

[data-theme='dark'] .${classes.hintContent} {
  border-top-color: color-mix(in srgb, var(--ifm-color-warning, #f59e0b) 45%, var(--ifm-color-emphasis-300));
}

[data-theme='dark'] .${classes.solutionContent} {
  border-top-color: color-mix(in srgb, var(--ifm-color-success, #14b8a6) 45%, var(--ifm-color-emphasis-300));
}

.${classes.blankWrap} {
  display: inline-flex;
  align-items: center;
  position: relative;
  margin: 0 0.4rem;
}

.${classes.blankInput} {
  width: 7rem;
  min-width: 6rem;
  padding: 0.2rem 0.5rem;
  border: 2px solid var(--ifm-color-primary);
  border-radius: 6px;
  background: var(--ifm-background-surface-color);
  color: var(--ifm-color-emphasis-900);
  height: 1.8em;
  font-family: var(--ifm-font-family-monospace);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.${classes.blankBadge} {
  position: absolute;
  top: -0.6rem;
  left: -0.6rem;
  background: var(--ifm-color-primary);
  color: #fff;
  font-size: 0.75em;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  font-weight: 700;
  box-shadow: var(--ifm-global-shadow-lw);
}

.${classes.blankTag} {
  display: inline-flex;
  align-items: center;
  background: var(--ifm-color-primary);
  color: #fff;
  border-radius: 999px;
  padding: 0.05rem 0.5rem;
  font-size: 0.85em;
  font-weight: 700;
  margin-right: 0.35rem;
  white-space: nowrap;
}

.${classes.blankAnswerList} {
  display: grid;
  gap: 0.4rem;
  margin-bottom: 1rem;
}

.${classes.blankAnswerItem} {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
}

.${classes.blankWrap}.${classes.blankHighlight} .${classes.blankInput} {
  border-color: var(--ifm-color-warning);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
}

.${classes.blankTag}.${classes.blankHighlight} {
  background: var(--ifm-color-warning);
}
`;

type GuidedTaskVariant = 'exercise' | 'quickCheck';
type GuidedTaskIconName = 'pencil' | 'checkCircle' | 'lightbulb' | 'chevron';

type ExtractedChildren = {
  answerContent: ReactNode;
  hintChildren: ReactElement<HintProps>[];
  problemChildren: ReactNode[];
};

export interface GuidedTaskProps {
  /** 課題の内容 */
  children: ReactNode;
  /** 解答欄の見出し */
  answerTitle?: string;
  /** 穴埋め置換を有効化 */
  enableBlanks?: boolean;
  /** 表示バリアント */
  variant?: GuidedTaskVariant;
  /** 検証エラーに表示するコンポーネント名 */
  componentName?: 'Exercise' | 'QuickCheck';
  /** QuickCheck の小見出し */
  quickCheckTitle?: string;
}

function useExerciseStyles(): void {
  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.getElementById(STYLE_ELEMENT_ID)) {
      return;
    }

    const styleElement = document.createElement('style');
    styleElement.id = STYLE_ELEMENT_ID;
    styleElement.textContent = stylesText;
    document.head.appendChild(styleElement);
  }, []);
}

function hasMeaningfulContent(child: ReactNode): boolean {
  if (child === null || child === undefined || typeof child === 'boolean') {
    return false;
  }
  if (typeof child === 'string') {
    return child.trim().length > 0;
  }
  if (Array.isArray(child)) {
    return child.some(hasMeaningfulContent);
  }
  return true;
}

function getElementDisplayName(child: ReactNode): string | null {
  if (!React.isValidElement(child)) {
    return null;
  }
  const type = child.type as {
    displayName?: string;
    name?: string;
    render?: { displayName?: string; name?: string };
    type?: { displayName?: string; name?: string };
  };
  return (
    type.displayName ??
    type.name ??
    type.render?.displayName ??
    type.render?.name ??
    type.type?.displayName ??
    type.type?.name ??
    null
  );
}

function isNestedGuidedTaskElement(child: ReactNode): boolean {
  return (
    React.isValidElement(child) &&
    matchesMarkedComponentType(
      child.type,
      null,
      '__exerciseGuidedTask',
      GUIDED_TASK_COMPONENT_NAME,
    )
  );
}

function getOrderLabel(child: ReactNode): string {
  if (isAnswerElement(child)) {
    return 'Answer';
  }
  if (isHintElement(child)) {
    return 'Hint';
  }
  if (isNestedGuidedTaskElement(child)) {
    return getElementDisplayName(child) ?? 'GuidedTask';
  }
  return 'problem content';
}

function createStructureError(
  componentName: string,
  childrenArray: ReactNode[],
  expectedOrder: string,
  reason: string,
): Error {
  const actualOrder = childrenArray.map(getOrderLabel).join(' > ') || '(empty)';
  return new Error(
    `${componentName} children are invalid: ${reason}. Actual order: ${actualOrder}. Expected order: ${expectedOrder}.`,
  );
}

function extractGuidedTaskChildren(
  children: ReactNode,
  componentName: 'Exercise' | 'QuickCheck',
): ExtractedChildren {
  const childrenArray = Children.toArray(children).filter(hasMeaningfulContent);
  const expectedOrder =
    'problem content, one or more Hint, then exactly one Answer';

  const nestedChild = childrenArray.find(isNestedGuidedTaskElement);
  if (nestedChild) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'nested Exercise or QuickCheck is not allowed',
    );
  }

  const answerChildren = childrenArray.filter(isAnswerElement);
  const hintChildren = childrenArray.filter(isHintElement);
  const problemChildren: ReactNode[] = [];
  let seenHint = false;
  let seenAnswer = false;

  for (const child of childrenArray) {
    if (isAnswerElement(child)) {
      seenAnswer = true;
      continue;
    }
    if (isHintElement(child)) {
      if (seenAnswer) {
        throw createStructureError(
          componentName,
          childrenArray,
          expectedOrder,
          'Hint must appear before Answer',
        );
      }
      seenHint = true;
      continue;
    }
    if (seenAnswer) {
      throw createStructureError(
        componentName,
        childrenArray,
        expectedOrder,
        'content after Answer is not allowed',
      );
    }
    if (seenHint) {
      throw createStructureError(
        componentName,
        childrenArray,
        expectedOrder,
        'problem content must appear before Hint',
      );
    }
    problemChildren.push(child);
  }

  if (!problemChildren.some(hasMeaningfulContent)) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'problem content is required',
    );
  }
  if (hintChildren.length < 1) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'at least one Hint is required',
    );
  }
  if (answerChildren.length !== 1) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'exactly one Answer is required',
    );
  }

  const emptyHint = hintChildren.find(
    (hintChild) =>
      !hasMeaningfulContent((hintChild.props as HintProps).children),
  );
  if (emptyHint) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'Hint content must not be empty',
    );
  }

  const answerChild = answerChildren[0];
  const answerContent = (answerChild.props as AnswerProps).children;
  if (!hasMeaningfulContent(answerContent)) {
    throw createStructureError(
      componentName,
      childrenArray,
      expectedOrder,
      'Answer content must not be empty',
    );
  }

  return {
    answerContent,
    hintChildren,
    problemChildren,
  };
}

function getHintTitle(index: number, total: number): string {
  return total === 1 ? 'ヒントを見る' : `ヒント${index + 1}`;
}

function renderGuidedTaskIcon(
  name: GuidedTaskIconName,
  className: string,
): ReactElement {
  const iconProps = {
    'aria-hidden': true,
    className,
    'data-guided-task-icon': name,
    focusable: false,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'pencil':
      return (
        <svg {...iconProps}>
          <path d="m4 20 3.7-.8L19 7.9a2.1 2.1 0 0 0-3-3L4.8 16.2 4 20Z" />
          <path d="m14.5 6.5 3 3" />
        </svg>
      );
    case 'checkCircle':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg {...iconProps}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M8.4 14.5A6 6 0 1 1 15.6 14.5c-.8.7-1.3 1.5-1.5 2.5h-4.2c-.2-1-.7-1.8-1.5-2.5Z" />
        </svg>
      );
    case 'chevron':
      return (
        <svg {...iconProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
  }
}

function GuidedTask({
  children,
  answerTitle,
  enableBlanks = false,
  variant = 'exercise',
  componentName = 'Exercise',
  quickCheckTitle = '理解度確認',
}: GuidedTaskProps): ReactElement {
  useExerciseStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    answerContent: detectedAnswerContent,
    hintChildren,
    problemChildren,
  } = extractGuidedTaskChildren(children, componentName);

  useEffect(() => {
    if (!enableBlanks) {
      return;
    }
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const cleanup = startBlankPlaceholderObserver(root);
    return () => {
      cleanup();
    };
  }, [enableBlanks]);

  const sectionClassName =
    variant === 'quickCheck'
      ? `${classes.section} ${classes.quickCheck}`
      : classes.section;
  const resolvedAnswerTitle = answerTitle ?? '解答を見る';

  return (
    <div className={sectionClassName} ref={rootRef}>
      {variant === 'quickCheck' && (
        <div className={`${classes.taskHeader} ${classes.quickCheckTitle}`}>
          {renderGuidedTaskIcon('checkCircle', classes.taskHeaderIcon)}
          <span>{quickCheckTitle}</span>
        </div>
      )}
      {variant === 'exercise' && (
        <div className={classes.taskHeader}>
          {renderGuidedTaskIcon('pencil', classes.taskHeaderIcon)}
          <span>演習</span>
        </div>
      )}
      <div className={classes.content}>{problemChildren}</div>
      {hintChildren.map((hintChild, index) => (
        <details className={classes.hint} key={hintChild.key ?? index}>
          <summary className={classes.summary}>
            <span className={classes.summaryLabel}>
              {renderGuidedTaskIcon('lightbulb', classes.summaryIcon)}
              <span>{getHintTitle(index, hintChildren.length)}</span>
            </span>
            {renderGuidedTaskIcon('chevron', classes.summaryChevron)}
          </summary>
          <div className={classes.hintContent}>
            {(hintChild.props as HintProps).children}
          </div>
        </details>
      ))}
      <details className={classes.solution}>
        <summary className={classes.summary}>
          <span className={classes.summaryLabel}>
            {renderGuidedTaskIcon('checkCircle', classes.summaryIcon)}
            <span>{resolvedAnswerTitle}</span>
          </span>
          {renderGuidedTaskIcon('chevron', classes.summaryChevron)}
        </summary>
        <div className={classes.solutionContent}>{detectedAnswerContent}</div>
      </details>
    </div>
  );
}

export default markExerciseComponent(
  GuidedTask,
  '__exerciseGuidedTask',
  GUIDED_TASK_COMPONENT_NAME,
);
