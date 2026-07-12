import React, { type ReactElement, type ReactNode } from 'react';
import Hint, { HINT_COMPONENT_NAME, type HintProps } from './Hint.js';
import { matchesMarkedComponentType } from './componentMarkers.js';

const matchesHintType = (type: unknown): boolean =>
  matchesMarkedComponentType(type, Hint, '__exerciseHint', HINT_COMPONENT_NAME);

export const isHintElement = (
  child: ReactNode,
): child is ReactElement<HintProps> =>
  React.isValidElement(child) && matchesHintType(child.type);
