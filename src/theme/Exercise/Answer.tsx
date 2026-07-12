import {
  useContext,
  useEffect,
  type ReactElement,
  type ReactNode,
} from 'react';
import { AnswerRegistrationContext } from './answerContext.js';
import { markExerciseComponent } from './componentMarkers.js';

export const ANSWER_COMPONENT_NAME = 'ExerciseAnswer';

export interface AnswerProps {
  /** 解答として表示する内容 */
  children: ReactNode;
}

function ExerciseAnswer({ children }: AnswerProps): ReactElement {
  const registerAnswer = useContext(AnswerRegistrationContext);

  useEffect(() => {
    if (!registerAnswer) {
      return;
    }
    registerAnswer({
      __exerciseAnswerAction: 'set',
      content: children,
    });
    return () => {
      registerAnswer({
        __exerciseAnswerAction: 'clear',
        content: children,
      });
    };
  }, [children, registerAnswer]);

  if (registerAnswer) {
    return <></>;
  }
  return <>{children}</>;
}

export default markExerciseComponent(
  ExerciseAnswer,
  '__exerciseAnswer',
  ANSWER_COMPONENT_NAME,
);
