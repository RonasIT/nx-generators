import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';
import { addNamedImport } from '../../../shared/utils';
import { mantineModuleName, mantineModuleSpecifier } from './update-providers';

export function wrapLayoutBodyWithMantine(content: string, uiKitLibrarySpecifier: string): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      indentationText: IndentationText.TwoSpaces,
      quoteKind: QuoteKind.Single,
    },
  });
  const file = project.createSourceFile('layout.tsx', content);

  const bodyElement = file
    .getDescendantsOfKind(SyntaxKind.JsxElement)
    .find((element) => element.getOpeningElement().getTagNameNode().getText() === 'body');

  if (!bodyElement) {
    throw new Error(
      "Could not find a '<body>' element in layout.tsx to wrap with the MantineProvider. " +
        'Please add the MantineProvider manually.',
    );
  }

  const openingText = bodyElement.getOpeningElement().getText();
  const closingText = bodyElement.getClosingElement().getText();
  const childrenText = bodyElement
    .getJsxChildren()
    .map((child) => child.getText())
    .join('');

  bodyElement.replaceWithText(
    `${openingText}\n<${mantineModuleName} theme={theme}>\n${childrenText}\n</${mantineModuleName}>\n${closingText}`,
  );

  addNamedImport(mantineModuleName, mantineModuleSpecifier, file);
  addNamedImport('theme', uiKitLibrarySpecifier, file);

  return file.getFullText();
}
