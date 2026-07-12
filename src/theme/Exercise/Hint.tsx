import { type ReactElement, type ReactNode } from 'react';
import { markExerciseComponent } from './componentMarkers.js';

export const HINT_COMPONENT_NAME = 'ExerciseHint';

export interface HintProps {
  /** ヒントとして表示する内容 */
  children: ReactNode;
}

function ExerciseHint({ children }: HintProps): ReactElement {
  return <>{children}</>;
}

export default markExerciseComponent(
  ExerciseHint,
  '__exerciseHint',
  HINT_COMPONENT_NAME,
);
