import { SourceFile } from 'ts-morph';

export const addNamedImport = (namedImport: string, moduleSpecifier: string, file: SourceFile): void => {
  const importDeclaration = file.getImportDeclaration(moduleSpecifier);
  if (importDeclaration) {
    const hasNamedImport = importDeclaration.getNamedImports()
      .find((declaration) => declaration.getName() === namedImport);
    if (!hasNamedImport) {
      importDeclaration.addNamedImport(namedImport);
    }
  } else {
    file.addImportDeclaration({
      namedImports: [namedImport],
      moduleSpecifier
    })
  }
}
