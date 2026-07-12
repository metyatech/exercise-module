import { type ReactElement, type ReactNode } from 'react';
import { markExerciseComponent } from './componentMarkers.js';
import GuidedTask from './GuidedTask.js';

export interface QuickCheckProps {
  /** 確認問題の内容 */
  children: ReactNode;
  /** 答え欄の見出し */
  answerTitle?: string;
  /** 穴埋め置換を有効化 */
  enableBlanks?: boolean;
  /** QuickCheck の小見出し */
  quickCheckTitle?: string;
}

function QuickCheck({
  children,
  answerTitle,
  enableBlanks = false,
  quickCheckTitle,
}: QuickCheckProps): ReactElement {
  return (
    <GuidedTask
      answerTitle={answerTitle}
      componentName="QuickCheck"
      enableBlanks={enableBlanks}
      quickCheckTitle={quickCheckTitle}
      variant="quickCheck"
    >
      {children}
    </GuidedTask>
  );
}

export default markExerciseComponent(
  QuickCheck,
  '__exerciseGuidedTask',
  'QuickCheck',
);
