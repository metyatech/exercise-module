import { type ReactElement, type ReactNode } from 'react';
import Answer, { type AnswerProps } from './Answer.js';
import GuidedTask from './GuidedTask.js';
import Hint, { type HintProps } from './Hint.js';
import QuickCheck, { type QuickCheckProps } from './QuickCheck.js';
import { markExerciseComponent } from './componentMarkers.js';

export interface ExerciseProps {
  /** 課題の内容 */
  children: ReactNode;
  /** 解答欄の見出し */
  answerTitle?: string;
  /** 穴埋め置換を有効化 */
  enableBlanks?: boolean;
}

function Exercise({
  children,
  answerTitle,
  enableBlanks = false,
}: ExerciseProps): ReactElement {
  return (
    <GuidedTask
      answerTitle={answerTitle}
      componentName="Exercise"
      enableBlanks={enableBlanks}
      variant="exercise"
    >
      {children}
    </GuidedTask>
  );
}

const markedExercise = markExerciseComponent(
  Exercise,
  '__exerciseGuidedTask',
  'Exercise',
);

export default markedExercise;
export { Answer, Hint, QuickCheck };
export type { AnswerProps, HintProps, QuickCheckProps };
