import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  IndentationText,
  Project,
  QuoteKind,
  SourceFile,
  SyntaxKind,
  VariableDeclaration
} from 'ts-morph';
import { addNamedImport } from '../../../shared/utils';

function getFormUsageCode(formClassName: string): string {
  return `const formSchema = new ${formClassName}();
const form = useForm({
  defaultValues: formSchema.formValues,
  resolver: yupResolver(${formClassName}.validationSchema)
});\n\n`
}

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

function getPlaceOfUse(file: SourceFile, placeOfUseName: string): FunctionExpression | ArrowFunction | FunctionDeclaration {
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

export async function addFormUsage(libPath: string, placeOfUseName: string, formClassName: string): Promise<void> {
  const project = new Project({
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single
    }
  });
  const files = project.addSourceFilesAtPaths([`${libPath}/lib/**/*.tsx`, `${libPath}/lib/**/*.ts`]);
  const file = files.find((file) => file.getFunction(placeOfUseName) || file.getVariableDeclaration(placeOfUseName));
  if (!file) {
    throw new Error('Could not find the place where the form should be used.');
  }

  const pathToForm = file.getFilePath().includes('components')
    ? '../../forms'
    : file.getFilePath().includes('hooks')
      ? '../forms'
      : './forms';
  addNamedImport(formClassName, pathToForm, file);
  addNamedImport('useForm', 'react-hook-form', file);
  addNamedImport('yupResolver', '@hookform/resolvers/yup', file);

  const placeOfUse = getPlaceOfUse(file, placeOfUseName);
  placeOfUse.setBodyText(`${getFormUsageCode(formClassName)}${placeOfUse.getBodyText()}`);

  project.saveSync();
}
