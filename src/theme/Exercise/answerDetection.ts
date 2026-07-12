import React, { type ReactElement, type ReactNode } from 'react';
import Answer, { ANSWER_COMPONENT_NAME, type AnswerProps } from './Answer.js';
import Solution, {
  SOLUTION_COMPONENT_NAME,
  type SolutionProps,
} from './Solution.js';
import { matchesMarkedComponentType } from './componentMarkers.js';

const matchesAnswerType = (type: unknown): boolean =>
  matchesMarkedComponentType(
    type,
    Answer,
    '__exerciseAnswer',
    ANSWER_COMPONENT_NAME,
  );

const matchesLegacySolutionType = (type: unknown): boolean =>
  matchesMarkedComponentType(
    type,
    Solution,
    '__exerciseSolution',
    SOLUTION_COMPONENT_NAME,
  );

export const isAnswerElement = (
  child: ReactNode,
): child is ReactElement<AnswerProps> =>
  React.isValidElement(child) && matchesAnswerType(child.type);

export const isLegacySolutionElement = (
  child: ReactNode,
): child is ReactElement<SolutionProps> =>
  React.isValidElement(child) && matchesLegacySolutionType(child.type);
