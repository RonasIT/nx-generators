import {
  factory,
  ObjectLiteralExpression,
  NodeArray,
  ObjectLiteralElementLike,
} from 'typescript';
import { PropertyAssignmentData } from '../types';
import { createPropertyAssignment } from './create-property-assignment';

export const createObjectLiteralExpression = (
  objectData: Array<PropertyAssignmentData>,
  restProperties: NodeArray<ObjectLiteralElementLike>,
): ObjectLiteralExpression =>
  factory.createObjectLiteralExpression([
    ...objectData.map(createPropertyAssignment),
    ...restProperties,
  ]);
