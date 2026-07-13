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
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f3ff 100%);
  border: 2px solid var(--ifm-color-primary-light);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15);
  position: relative;
  max-width: 100%;
}

.${classes.section}.${classes.quickCheck} {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.06) 0%, rgba(25, 118, 210, 0.03) 100%);
  border: 1px dashed var(--ifm-color-primary-lighter);
  box-shadow: none;
  padding: 1rem;
}

[data-theme='dark'] .${classes.section} {
  background: linear-gradient(135deg, #1a2332 0%, #253140 100%);
  border-color: var(--ifm-color-primary-darker);
  box-shadow: 0 4px 12px rgba(100, 181, 246, 0.15);
}

[data-theme='dark'] .${classes.section}.${classes.quickCheck} {
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.12) 0%, rgba(100, 181, 246, 0.06) 100%);
  border-color: var(--ifm-color-primary-dark);
}

.${classes.section}::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  background: linear-gradient(180deg, var(--ifm-color-primary) 0%, var(--ifm-color-primary-light) 100%);
}

.${classes.section} h3,
.${classes.section} h4 {
  color: var(--ifm-color-primary-dark);
  font-weight: 700;
  margin-top: 0;
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

[data-theme='dark'] .${classes.section} h3,
[data-theme='dark'] .${classes.section} h4 {
  color: var(--ifm-color-primary-light);
}

.${classes.section} h3::before,
.${classes.section} h4::before {
  content: '💪';
  margin-right: 0.8rem;
  font-size: 1.2em;
}

.${classes.quickCheckTitle} {
  color: var(--ifm-color-primary-dark);
  font-weight: var(--ifm-font-weight-bold);
  margin-bottom: 0.75rem;
}

[data-theme='dark'] .${classes.quickCheckTitle} {
  color: var(--ifm-color-primary-light);
}

.${classes.section} .prism-code {
  border: 1px solid var(--ifm-color-primary-lighter);
  background: rgba(255, 255, 255, 0.8);
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

.${classes.content} > * {
  min-width: 0;
}

.${classes.content} {
  display: grid;
  gap: 1.25rem;
}

.${classes.section} ol,
.${classes.section} ul {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin: 1rem 0;
}

[data-theme='dark'] .${classes.section} ol,
[data-theme='dark'] .${classes.section} ul {
  background: rgba(0, 0, 0, 0.2);
}

.${classes.section} ol > li {
  font-weight: 600;
  color: var(--ifm-color-primary-dark);
  margin-bottom: 1rem;
}

[data-theme='dark'] .${classes.section} ol > li {
  color: var(--ifm-color-primary-light);
}

.${classes.hint},
.${classes.solution} {
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: var(--ifm-border-radius);
  padding: var(--ifm-alert-padding-vertical) var(--ifm-alert-padding-horizontal);
  margin: var(--ifm-spacing-vertical) 0;
  background-color: var(--ifm-background-surface-color);
  box-shadow: var(--ifm-global-shadow-lw);
}

.${classes.hint} > summary,
.${classes.solution} > summary {
  font-weight: var(--ifm-font-weight-bold);
  color: var(--ifm-color-primary-dark);
  cursor: pointer;
  margin-bottom: 0;
  padding: 0;
  list-style: none;
  outline: none;
  position: relative;
  padding-left: 1.5rem;
}

.${classes.hint} > summary::-webkit-details-marker,
.${classes.solution} > summary::-webkit-details-marker {
  display: none;
}

.${classes.hint} > summary::before,
.${classes.solution} > summary::before {
  content: '▶';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--ifm-color-primary);
  font-size: 0.8em;
  transition: transform 0.2s ease;
}

.${classes.hint}[open] > summary::before,
.${classes.solution}[open] > summary::before {
  transform: rotate(90deg);
}

[data-theme='dark'] .${classes.hint} > summary,
[data-theme='dark'] .${classes.solution} > summary {
  color: var(--ifm-color-primary-light);
}

.${classes.hint} > summary:hover,
.${classes.solution} > summary:hover {
  color: var(--ifm-color-primary);
}

.${classes.hintContent},
.${classes.solutionContent} {
  margin-top: var(--ifm-spacing-vertical);
  padding-top: var(--ifm-spacing-vertical);
  border-top: 1px solid var(--ifm-color-emphasis-300);
}

.${classes.hint}::details-content,
.${classes.solution}::details-content {
  transition: height 306ms ease-in-out, content-visibility 306ms allow-discrete;
  interpolate-size: allow-keywords;
  overflow: hidden;
  height: 0;
}

.${classes.hint}[open]::details-content,
.${classes.solution}[open]::details-content {
  height: auto;
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
  const resolvedAnswerTitle =
    answerTitle ?? (variant === 'quickCheck' ? '答えを見る' : '解答を見る');

  return (
    <div className={sectionClassName} ref={rootRef}>
      {variant === 'quickCheck' && (
        <div className={classes.quickCheckTitle}>{quickCheckTitle}</div>
      )}
      <div className={classes.content}>{problemChildren}</div>
      {hintChildren.map((hintChild, index) => (
        <details className={classes.hint} key={hintChild.key ?? index}>
          <summary>{getHintTitle(index, hintChildren.length)}</summary>
          <div className={classes.hintContent}>
            {(hintChild.props as HintProps).children}
          </div>
        </details>
      ))}
      <details className={classes.solution}>
        <summary>{resolvedAnswerTitle}</summary>
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
