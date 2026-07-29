import { IndentationText, Project, QuoteKind, SyntaxKind } from 'ts-morph';
import { addNamedImport } from '../../../shared/utils';
import { nuqsAdapterModuleSpecifier } from './update-providers';

export function wrapLayoutBodyWithNuqsAdapter(content: string): string {
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
      "Could not find a '<body>' element in layout.tsx to wrap with the NuqsAdapter. " +
        'Please add the NuqsAdapter manually.',
    );
  }

  const openingText = bodyElement.getOpeningElement().getText();
  const closingText = bodyElement.getClosingElement().getText();
  const childrenText = bodyElement
    .getJsxChildren()
    .map((child) => child.getText())
    .join('');

  bodyElement.replaceWithText(`${openingText}\n<NuqsAdapter>\n${childrenText}\n</NuqsAdapter>\n${closingText}`);

  addNamedImport('NuqsAdapter', nuqsAdapterModuleSpecifier, file);

  return file.getFullText();
}
