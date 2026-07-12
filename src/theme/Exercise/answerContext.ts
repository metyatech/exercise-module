import React from 'react';

export type AnswerRegistrationAction = {
  __exerciseAnswerAction: 'set' | 'clear';
  content: React.ReactNode;
};

export type AnswerRegistrationPayload =
  | React.ReactNode
  | AnswerRegistrationAction;

export type AnswerRegistration = (payload: AnswerRegistrationPayload) => void;

export const AnswerRegistrationContext =
  React.createContext<AnswerRegistration | null>(null);
