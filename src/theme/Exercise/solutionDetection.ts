import React, {type ReactElement, type ReactNode} from 'react';
import Solution, {SOLUTION_COMPONENT_NAME, type SolutionProps} from './Solution.js';

const matchesSolutionType = (type: unknown): boolean => {
  if (type === Solution) {
    return true;
  }

  if (typeof type === 'function') {
    const candidate = type as {
      __exerciseSolution?: boolean;
      displayName?: string;
    };
    return (
      candidate.__exerciseSolution === true ||
      candidate.displayName === SOLUTION_COMPONENT_NAME
    );
  }

  if (typeof type === 'object' && type) {
    const candidate = type as {
      __exerciseSolution?: boolean;
      displayName?: string;
      type?: unknown;
      render?: unknown;
    };
    if (
      candidate.__exerciseSolution === true ||
      candidate.displayName === SOLUTION_COMPONENT_NAME
    ) {
      return true;
    }
    if (candidate.type && matchesSolutionType(candidate.type)) {
      return true;
    }
    if (candidate.render && matchesSolutionType(candidate.render)) {
      return true;
    }
  }

  return false;
};

export const isSolutionElement = (
  child: ReactNode,
): child is ReactElement<SolutionProps> =>
  React.isValidElement(child) && matchesSolutionType(child.type);
