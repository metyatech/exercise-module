import React, { type ReactElement, type ReactNode } from 'react';
import Answer, {
  ANSWER_COMPONENT_NAME,
  LEGACY_SOLUTION_MARKER,
  type AnswerProps,
} from './Answer.js';
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

function hasLegacySolutionMarker(child: ReactNode): boolean {
  if (!React.isValidElement(child)) {
    return false;
  }
  const props = (child.props ?? {}) as Record<string, unknown>;
  return props[LEGACY_SOLUTION_MARKER] === true;
}

export const isAnswerElement = (
  child: ReactNode,
): child is ReactElement<AnswerProps> =>
  React.isValidElement(child) &&
  matchesAnswerType(child.type) &&
  !hasLegacySolutionMarker(child);

export const isLegacySolutionElement = (
  child: ReactNode,
): child is ReactElement<SolutionProps> =>
  React.isValidElement(child) &&
  (matchesLegacySolutionType(child.type) ||
    (matchesAnswerType(child.type) && hasLegacySolutionMarker(child)));
