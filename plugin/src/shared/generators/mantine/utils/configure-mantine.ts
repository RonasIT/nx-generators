import { IndentationText, Project, QuoteKind, StructureKind, SyntaxKind } from 'ts-morph';
import { addNamedImport } from '../../../utils';
import { mantineModuleSpecifier, mantineStylesSpecifier } from './update-providers';

export function configureMantine(content: string, globalStylesSpecifier: string): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });
  const file = project.createSourceFile('layout.tsx', content);
  const layoutFunction = file.getFunction('RootLayout');

  if (!layoutFunction) {
    throw new Error("Could not find the 'RootLayout' function in layout.tsx.");
  }

  const returnStatement = layoutFunction.getFirstDescendantByKind(SyntaxKind.ReturnStatement);
  const returnExpression = returnStatement?.getExpression();
  const jsxRoot =
    returnExpression?.getKind() === SyntaxKind.ParenthesizedExpression
      ? returnExpression.asKindOrThrow(SyntaxKind.ParenthesizedExpression).getExpression()
      : returnExpression;

  if (!jsxRoot || jsxRoot.getKind() !== SyntaxKind.JsxElement) {
    throw new Error(
      "Could not find the root JSX element returned by the 'RootLayout' function. " +
        'Please configure Mantine manually. See docs: https://mantine.dev/guides/next/#setup-with-app-router',
    );
  }

  const jsxElement = jsxRoot.asKindOrThrow(SyntaxKind.JsxElement);

  jsxElement.getOpeningElement().addAttribute({
    kind: StructureKind.JsxSpreadAttribute,
    expression: 'mantineHtmlProps',
  });

  const headElement = file
    .getDescendantsOfKind(SyntaxKind.JsxElement)
    .find((element) => element.getOpeningElement().getTagNameNode().getText() === 'head');

  if (!headElement) {
    throw new Error(
      "Could not find a '<head>' element in layout.tsx to add the ColorSchemeScript to. " + 'Please add it manually.',
    );
  }

  const openingText = headElement.getOpeningElement().getText();
  const closingText = headElement.getClosingElement().getText();
  const childrenText = headElement
    .getJsxChildren()
    .map((child) => child.getText())
    .join('');

  headElement.replaceWithText(`${openingText}${childrenText}\n<ColorSchemeScript />\n${closingText}`);

  addNamedImport('mantineHtmlProps', mantineModuleSpecifier, file);
  addNamedImport('ColorSchemeScript', mantineModuleSpecifier, file);

  const importDeclarations = file.getImportDeclarations();
  const hasStylesImport = importDeclarations.some(
    (importDeclaration) => importDeclaration.getModuleSpecifierValue() === mantineStylesSpecifier,
  );
  const hasGlobalStylesImport = importDeclarations.some(
    (importDeclaration) => importDeclaration.getModuleSpecifierValue() === globalStylesSpecifier,
  );

  if (!hasStylesImport) {
    file.addImportDeclaration({ moduleSpecifier: mantineStylesSpecifier });
  }

  if (!hasGlobalStylesImport) {
    file.addImportDeclaration({ moduleSpecifier: globalStylesSpecifier });
  }

  return file.getFullText();
}
