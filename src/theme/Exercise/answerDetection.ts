import React, { type ReactElement, type ReactNode } from 'react';
import Answer, { ANSWER_COMPONENT_NAME, type AnswerProps } from './Answer.js';
import Hint, { HINT_COMPONENT_NAME } from './Hint.js';
import { matchesMarkedComponentType } from './componentMarkers.js';

const matchesAnswerType = (type: unknown): boolean =>
  matchesMarkedComponentType(
    type,
    Answer,
    '__exerciseAnswer',
    ANSWER_COMPONENT_NAME,
  );

const matchesHintType = (type: unknown): boolean =>
  matchesMarkedComponentType(type, Hint, '__exerciseHint', HINT_COMPONENT_NAME);

export const isAnswerElement = (
  child: ReactNode,
): child is ReactElement<AnswerProps> =>
  React.isValidElement(child) && matchesAnswerType(child.type);

export const isHintElementLike = (child: ReactNode): boolean =>
  React.isValidElement(child) && matchesHintType(child.type);
