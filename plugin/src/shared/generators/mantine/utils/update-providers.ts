import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';
import { addNamedImport } from '../../../utils';

export const mantineModuleName = 'MantineProvider';
export const mantineModuleSpecifier = '@mantine/core';
export const mantineStylesSpecifier = '@mantine/core/styles.layer.css';

export function hasMantineProvider(content: string): boolean {
  return content.includes(mantineModuleName);
}

export function addMantineProvider(content: string, uiKitLibrarySpecifier: string): string {
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
      "Could not find the root JSX element returned by the 'Providers' function to wrap with MantineProvider. " +
        'Please add the MantineProvider manually.',
    );
  }

  const jsxElement = jsxRoot.asKindOrThrow(SyntaxKind.JsxElement);
  const openingText = jsxElement.getOpeningElement().getText();
  const closingText = jsxElement.getClosingElement().getText();
  const childrenText = jsxElement
    .getJsxChildren()
    .map((child) => child.getText())
    .join('');

  jsxElement.replaceWithText(
    `${openingText}\n<MantineProvider theme={theme}>\n${childrenText}\n</MantineProvider>\n${closingText}`,
  );

  addNamedImport('MantineProvider', mantineModuleSpecifier, file);
  addNamedImport('theme', uiKitLibrarySpecifier, file);

  return file.getFullText();
}
