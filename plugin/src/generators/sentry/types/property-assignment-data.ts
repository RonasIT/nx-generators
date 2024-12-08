import { Expression } from 'typescript';

export type PropertyAssignmentData = {
  key: string;
  initializer: Expression;
  comment?: string;
};
