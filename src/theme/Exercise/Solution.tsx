import {useContext, useEffect, type ReactElement, type ReactNode} from 'react';
import {SolutionRegistrationContext} from './solutionContext.js';

export const SOLUTION_COMPONENT_NAME = 'ExerciseSolution';

export interface SolutionProps {
  /** 解答として表示する内容 */
  children: ReactNode;
}

export default function Solution({children}: SolutionProps): ReactElement | null {
  const registerSolution = useContext(SolutionRegistrationContext);

  useEffect(() => {
    if (!registerSolution) {
      return;
    }
    registerSolution(children);
  }, [children, registerSolution]);

  if (registerSolution) {
    return null;
  }
  return <>{children}</>;
}

type SolutionComponent = typeof Solution & {
  __exerciseSolution?: true;
  displayName?: string;
};

const solutionComponent = Solution as SolutionComponent;
solutionComponent.displayName = SOLUTION_COMPONENT_NAME;
solutionComponent.__exerciseSolution = true;
