import { type ReactElement } from 'react';
import Answer, { type AnswerProps } from './Answer.js';
import { markExerciseComponent } from './componentMarkers.js';

export const SOLUTION_COMPONENT_NAME = 'ExerciseSolution';

export type SolutionProps = AnswerProps;

function ExerciseSolution({ children }: SolutionProps): ReactElement {
  return <Answer>{children}</Answer>;
}

export default markExerciseComponent(
  ExerciseSolution,
  '__exerciseSolution',
  SOLUTION_COMPONENT_NAME,
);
