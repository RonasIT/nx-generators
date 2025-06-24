/// <reference types="jest" />
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import * as utils from '../../shared/utils';
import { entityApiGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(({ choices }) => ({
    run: jest.fn().mockResolvedValue(choices[0]),
  })),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  getNxLibsPaths: jest.fn(() => ['libs/my-app/shared/data-access/api']),
  searchNxLibsPaths: jest.fn((paths) => paths.filter((p: string) => p.endsWith('api'))),
  searchAliasPath: jest.fn(() => '@libs/shared/data-access/api'),
  appendFileContent: jest.fn(),
  addNamedImport: jest.fn(),
}));

jest.mock('ts-morph', () => {
  const addProperty = jest.fn();
  const addElement = jest.fn();
  const storeMock = {
    getVariableDeclarationOrThrow: jest.fn(() => ({
      getInitializerIfKindOrThrow: jest.fn(() => ({
        addProperty,
        addElement,
      })),
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

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate entity files and update redux store', async () => {
    await entityApiGenerator(tree, {
      name: 'user',
      baseEndpoint: '/users',
    });

    // Check file creation
    const entityPath = 'libs/my-app/shared/data-access/api/lib/user';
    const files = tree.children(entityPath);
    expect(files).toContain('models');
    expect(files).toContain('api.ts');
    expect(tree.exists(`${entityPath}/models/user.ts`)).toBe(true);

    // Check that appendFileContent was called
    expect(utils.appendFileContent).toHaveBeenCalledWith(
      expect.stringContaining('index.ts'),
      expect.stringContaining(`export * from './user';`),
      tree,
    );
  });
});
