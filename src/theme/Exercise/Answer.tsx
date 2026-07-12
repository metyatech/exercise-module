import {
  useContext,
  useEffect,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AnswerRegistrationContext } from './answerContext.js';
import { markExerciseComponent } from './componentMarkers.js';

export const ANSWER_COMPONENT_NAME = 'ExerciseAnswer';

/**
 * Internal marker used by the legacy `<Solution>` adapter to flag an
 * `<Answer>` element as legacy Solution content. Treated as private API and is
 * intentionally not exported through the public component props surface.
 */
export const LEGACY_SOLUTION_MARKER = '__exerciseLegacySolution';

export interface AnswerProps {
  /** 解答として表示する内容 */
  children: ReactNode;
}

interface InternalAnswerProps extends AnswerProps {
  [LEGACY_SOLUTION_MARKER]?: boolean;
}

function ExerciseAnswer({
  children,
  [LEGACY_SOLUTION_MARKER]: isLegacySolution,
}: InternalAnswerProps): ReactElement {
  const answerRegistrationInput = useContext(AnswerRegistrationContext);
  const answerRegistration =
    typeof answerRegistrationInput === 'function'
      ? {
          allowLegacySolutionRegistration: false,
          registerAnswer: answerRegistrationInput,
        }
      : answerRegistrationInput;

  useEffect(() => {
    if (!answerRegistration) {
      return;
    }
    if (
      isLegacySolution &&
      !answerRegistration.allowLegacySolutionRegistration
    ) {
      return;
    }
    answerRegistration.registerAnswer({
      __exerciseAnswerAction: 'set',
      content: children,
    });
    return () => {
      answerRegistration.registerAnswer({
        __exerciseAnswerAction: 'clear',
        content: children,
      });
    };
  }, [answerRegistration, children, isLegacySolution]);

  if (answerRegistration) {
    if (
      isLegacySolution &&
      !answerRegistration.allowLegacySolutionRegistration
    ) {
      throw new Error('legacy Solution cannot be mixed with Hint or Answer');
    }
    return <></>;
  }
  return <>{children}</>;
}

export default markExerciseComponent(
  ExerciseAnswer,
  '__exerciseAnswer',
  ANSWER_COMPONENT_NAME,
);
