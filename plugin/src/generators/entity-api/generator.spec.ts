/// <reference types="jest" />
import * as fs from 'fs';
import * as path from 'path';
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
  const templateDir = path.join(__dirname, 'files');

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate entity files and update redux store', async () => {
    await entityApiGenerator(tree, {
      name: 'user',
      baseEndpoint: '/users',
    });

    const entityPath = 'libs/my-app/shared/data-access/api/lib/user';
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

    expect(utils.appendFileContent).toHaveBeenCalledWith(
      expect.stringContaining('index.ts'),
      expect.stringContaining(`export * from './user';`),
      tree,
    );
  });
});
