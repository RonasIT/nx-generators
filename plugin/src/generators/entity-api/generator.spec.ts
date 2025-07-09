/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { entityApiGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(({ choices }) => ({
    run: jest.fn().mockResolvedValue(choices[0]),
  })),
}));

jest.mock('ts-morph', () => {
  const addProperty = jest.fn();
  const addElement = jest.fn();
  const getNamedImports = jest.fn(() => []);
  const addNamedImport = jest.fn();

  const storeMock = {
    getVariableDeclarationOrThrow: jest.fn(() => ({
      getInitializerIfKindOrThrow: jest.fn(() => ({
        addProperty,
        addElement,
      })),
    })),
    getImportDeclaration: jest.fn(() => ({
      getNamedImports,
      addNamedImport,
    })),
    addImportDeclaration: jest.fn(),
  };

  return {
    Project: jest.fn().mockImplementation(() => ({
      addSourceFileAtPath: jest.fn(() => storeMock),
      saveSync: jest.fn(),
    })),
    StructureKind: { PropertyAssignment: 'PropertyAssignment' },
    SyntaxKind: {
      ObjectLiteralExpression: 'ObjectLiteralExpression',
      ArrayLiteralExpression: 'ArrayLiteralExpression',
    },
    IndentationText: { TwoSpaces: 'TwoSpaces' },
    QuoteKind: { Single: 'Single' },
  };
});

describe('entityApiGenerator', () => {
  let tree: Tree;
  const templateDir = path.join(__dirname, 'files');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();

    // Provide a realistic tsconfig.base.json so utils can find libs
    tree.write(
      'tsconfig.base.json',
      JSON.stringify({
        compilerOptions: {
          paths: {
            '@libs/shared/data-access/api': ['libs/mobile/shared/data-access/api/src/index.ts'],
          },
        },
      }),
    );
  });

  it('should generate entity files and update redux store', async () => {
    await entityApiGenerator(tree, {
      name: 'user',
      baseEndpoint: '/users',
    });

    const entityPath = 'libs/mobile/shared/data-access/api/src/lib/user';
    const modelFilePath = `${entityPath}/models/user.ts`;
    const apiFilePath = `${entityPath}/api.ts`;

    expect(tree.exists(modelFilePath)).toBe(true);
    expect(tree.exists(apiFilePath)).toBe(true);

    // Get first lines of generated files
    const modelFirstLine = tree.read(modelFilePath)?.toString().split('\n')[0];
    const apiFirstLine = tree.read(apiFilePath)?.toString().split('\n')[0];

    // Get first lines from template files
    const templateModelFirstLine = fs
      .readFileSync(path.join(templateDir, 'models', '__entityFileName__.ts.template'), 'utf-8')
      .split('\n')[0];
    const templateApiFirstLine = fs.readFileSync(path.join(templateDir, 'api.ts.template'), 'utf-8').split('\n')[0];

    expect(modelFirstLine).toBe(templateModelFirstLine);
    expect(apiFirstLine).toBe(templateApiFirstLine);

    // check that index.ts now contains export for the entity
    const indexContent = tree.read('libs/mobile/shared/data-access/api/src/lib/index.ts')?.toString();
    expect(indexContent).toContain(`export * from './user';`);
  });
});
