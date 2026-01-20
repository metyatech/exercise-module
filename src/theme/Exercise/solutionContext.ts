import React from 'react';

export type SolutionRegistration = (content: React.ReactNode) => void;

export const SolutionRegistrationContext =
  React.createContext<SolutionRegistration | null>(null);
