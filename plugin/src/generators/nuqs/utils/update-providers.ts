import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';
import { addNamedImport } from '../../../shared/utils';

export const nuqsAdapterModuleSpecifier = 'nuqs/adapters/next/app';

export function hasNuqsAdapter(content: string): boolean {
  return content.includes(nuqsAdapterModuleSpecifier);
}

export function addNuqsAdapterToProviders(content: string): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });
  const file = project.createSourceFile('providers.tsx', content);

  const providersFunction = file.getFunction('Providers');

  if (!providersFunction) {
    throw new Error("Could not find the 'Providers' function in providers.tsx.");
  }

  const returnStatement = providersFunction.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const returnExpression = returnStatement?.getExpression();
  const jsxRoot =
    returnExpression?.getKind() === SyntaxKind.ParenthesizedExpression
      ? returnExpression.asKindOrThrow(SyntaxKind.ParenthesizedExpression).getExpression()
      : returnExpression;

  if (!jsxRoot || jsxRoot.getKind() !== SyntaxKind.JsxElement) {
    throw new Error(
      "Could not find the root JSX element returned by the 'Providers' function to wrap with NuqsAdapter. " +
        'Please add the NuqsAdapter manually.',
    );
  }

  const jsxElement = jsxRoot.asKindOrThrow(SyntaxKind.JsxElement);
  const openingText = jsxElement.getOpeningElement().getText();
  const closingText = jsxElement.getClosingElement().getText();
  const childrenText = jsxElement
    .getJsxChildren()
    .map((child) => child.getText())
    .join('');

  jsxElement.replaceWithText(`${openingText}\n<NuqsAdapter>\n${childrenText}\n</NuqsAdapter>\n${closingText}`);

  addNamedImport('NuqsAdapter', nuqsAdapterModuleSpecifier, file);

  return file.getFullText();
}
