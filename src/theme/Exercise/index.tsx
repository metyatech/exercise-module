import React, {
  Children,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import Heading from '@theme/Heading';
import Solution, {type SolutionProps} from './Solution.js';
import {startBlankPlaceholderObserver} from './blanks.js';
import {exerciseClasses as classes} from './classes.js';
import {isSolutionElement} from './solutionDetection.js';
import {SolutionRegistrationContext} from './solutionContext.js';

const STYLE_ELEMENT_ID = 'metyatech-exercise-style';

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

[data-theme='dark'] .${classes.section} {
  background: linear-gradient(135deg, #1a2332 0%, #253140 100%);
  border-color: var(--ifm-color-primary-darker);
  box-shadow: 0 4px 12px rgba(100, 181, 246, 0.15);
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

.${classes.solution} {
  border: 1px solid var(--ifm-color-emphasis-300);
  border-radius: var(--ifm-border-radius);
  padding: var(--ifm-alert-padding-vertical) var(--ifm-alert-padding-horizontal);
  margin: var(--ifm-spacing-vertical) 0;
  background-color: var(--ifm-background-surface-color);
  box-shadow: var(--ifm-global-shadow-lw);
}

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

.${classes.solution} > summary::-webkit-details-marker {
  display: none;
}

.${classes.solution} > summary::before {
  content: '▶';
  position: absolute;
  left: 0;
  top: 0;
  color: var(--ifm-color-primary);
  font-size: 0.8em;
  transition: transform 0.2s ease;
}

.${classes.solution}[open] > summary::before {
  transform: rotate(90deg);
}

[data-theme='dark'] .${classes.solution} > summary {
  color: var(--ifm-color-primary-light);
}

.${classes.solution} > summary:hover {
  color: var(--ifm-color-primary);
}

.${classes.solutionContent} {
  margin-top: var(--ifm-spacing-vertical);
  padding-top: var(--ifm-spacing-vertical);
  border-top: 1px solid var(--ifm-color-emphasis-300);
}

.${classes.solution}::details-content {
  transition: height 306ms ease-in-out, content-visibility 306ms allow-discrete;
  interpolate-size: allow-keywords;
  overflow: hidden;
  height: 0;
}

.${classes.solution}[open]::details-content {
  height: auto;
}

.exerciseHeadingAnchor {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
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

function isHeadingElement(
  child: ReactNode,
): child is ReactElement<{id?: string; children?: ReactNode}> {
  return (
    React.isValidElement(child) &&
    typeof child.type === 'string' &&
    /^h[1-6]$/.test(child.type as string)
  );
}

const keepFirstRegisteredSolution = (
  current: ReactNode | null,
  next: ReactNode,
): ReactNode | null => {
  if (next === null) {
    return null;
  }
  return current ?? next;
};

export interface ExerciseProps {
  /** 演習タイトル */
  title: string;
  /** 課題の内容 */
  children: ReactNode;
  /** 解答欄の見出し */
  solutionTitle?: string;
  /** 穴埋め置換を有効化 */
  enableBlanks?: boolean;
  /** TOC連携用の見出しID */
  headingId?: string;
  /** 見出しレベル */
  headingLevel?: number;
}

export {Solution};
export type {SolutionProps};

export default function Exercise({
  title,
  children,
  solutionTitle = '解答を表示',
  enableBlanks = false,
  headingId,
  headingLevel,
}: ExerciseProps): ReactElement {
  useExerciseStyles();
  const rootRef = useRef<HTMLDivElement>(null);

  const childrenArray = Children.toArray(children);

  const headingIndex = childrenArray.findIndex(isHeadingElement);
  const headingElement =
    headingIndex >= 0
      ? (childrenArray[headingIndex] as ReactElement<{
          id?: string;
          children?: ReactNode;
        }>)
      : undefined;

  if (headingIndex >= 0) {
    childrenArray.splice(headingIndex, 1);
  }

  const visualHeadingId =
    headingElement?.props?.id ?? (headingId ? `${headingId}--title` : undefined);
  const headingContent = headingElement?.props?.children ?? title;
  const fallbackHeadingTag = toHeadingTag(headingLevel);
  const headingTag = (headingElement &&
    typeof headingElement.type === 'string' &&
    /^h[1-6]$/.test(headingElement.type as string)
      ? headingElement.type
      : fallbackHeadingTag) as ExerciseHeadingTag;

  const solutionChild = childrenArray.find(isSolutionElement);
  const detectedSolutionContent =
    React.isValidElement(solutionChild) && solutionChild.props
      ? (solutionChild.props as SolutionProps).children
      : null;
  const [registeredSolution, setRegisteredSolution] = useState<ReactNode | null>(
    null,
  );
  const registerSolution = useCallback((content: ReactNode) => {
    setRegisteredSolution((current) => keepFirstRegisteredSolution(current, content));
  }, []);
  const solutionContent = detectedSolutionContent ?? registeredSolution;

  const problemChildren = childrenArray.filter((child) => !isSolutionElement(child));

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

  return (
    <SolutionRegistrationContext.Provider value={registerSolution}>
      <div className={classes.section} aria-labelledby={headingId} ref={rootRef}>
        <Heading
          as={headingTag}
          id={visualHeadingId}
          aria-hidden={headingId ? 'true' : undefined}
        >
          {headingContent}
        </Heading>
        <div className={classes.content}>{problemChildren}</div>
        {solutionContent && (
          <details className={classes.solution}>
            <summary>{solutionTitle}</summary>
            <div className={classes.solutionContent}>{solutionContent}</div>
          </details>
        )}
      </div>
    </SolutionRegistrationContext.Provider>
  );
}

type ExerciseHeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

function toHeadingTag(level?: number): ExerciseHeadingTag {
  if (!level) {
    return 'h3';
  }

  const normalized = Math.min(6, Math.max(1, Math.round(level)));
  return `h${normalized}` as ExerciseHeadingTag;
}

