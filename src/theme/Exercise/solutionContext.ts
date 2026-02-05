import React from 'react';

export type SolutionRegistrationAction = {
  __exerciseSolutionAction: 'set' | 'clear';
  content: React.ReactNode;
};

export type SolutionRegistrationPayload =
  | React.ReactNode
  | SolutionRegistrationAction;

export type SolutionRegistration = (
  payload: SolutionRegistrationPayload,
) => void;

export const SolutionRegistrationContext =
  React.createContext<SolutionRegistration | null>(null);
