import {
  factory,
  PropertyAssignment,
  SyntaxKind,
  addSyntheticLeadingComment,
} from 'typescript';
import { PropertyAssignmentData } from '../types';

export const createPropertyAssignment = ({
  key,
  initializer,
  comment,
}: PropertyAssignmentData): PropertyAssignment => {
  const property = factory.createPropertyAssignment(
    factory.createIdentifier(key),
    initializer,
  );

  if (comment) {
    addSyntheticLeadingComment(
      property,
      SyntaxKind.SingleLineCommentTrivia,
      ` ${comment}`,
    );
  }

  return property;
};
