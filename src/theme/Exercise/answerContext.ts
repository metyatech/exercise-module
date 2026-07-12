import React from 'react';

export type AnswerRegistrationAction = {
  __exerciseAnswerAction: 'set' | 'clear';
  content: React.ReactNode;
};

export type AnswerRegistrationPayload =
  | React.ReactNode
  | AnswerRegistrationAction;

export type AnswerRegistration = (payload: AnswerRegistrationPayload) => void;

export type AnswerRegistrationContextValue = {
  registerAnswer: AnswerRegistration;
};

export type AnswerRegistrationContextInput =
  | AnswerRegistration
  | AnswerRegistrationContextValue;

export const AnswerRegistrationContext =
  React.createContext<AnswerRegistrationContextInput | null>(null);
