import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from 'ts-morph';

function getForwardRefFunction(variable: VariableDeclaration): FunctionExpression | ArrowFunction {
  const callExpressionInitializer = variable.getInitializerIfKind(SyntaxKind.CallExpression);
  if (!callExpressionInitializer || callExpressionInitializer.getExpression().getText() !== 'forwardRef') {
    throw new Error('Could not find forwardRef');
  }

  const argument = callExpressionInitializer.getArguments()[0];
  if (!argument || ![SyntaxKind.FunctionExpression, SyntaxKind.ArrowFunction].includes(argument.getKind())) {
    throw new Error('Could not find a component function in forwardRef');
  }

  return argument.asKind(argument.getKind() === SyntaxKind.FunctionExpression ? SyntaxKind.FunctionExpression : SyntaxKind.ArrowFunction);
}

export function getPlaceOfUse(file: SourceFile, placeOfUseName: string): FunctionExpression | ArrowFunction | FunctionDeclaration {
  const placeOfUseFunction = file.getFunction(placeOfUseName);
  if (placeOfUseFunction) {
    return placeOfUseFunction;
  }

  const variable = file.getVariableDeclaration(placeOfUseName);
  if (!variable) {
    throw new Error(`Could not find the place where the form should be used (${placeOfUseName}).`);
  }

  return variable.getInitializerIfKind(SyntaxKind.FunctionExpression)
    || variable.getInitializerIfKind(SyntaxKind.ArrowFunction)
    || getForwardRefFunction(variable);
}
