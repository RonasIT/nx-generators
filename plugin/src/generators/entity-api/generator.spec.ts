/// <reference types="jest" />
import * as path from 'path';
import * as devkit from '@nx/devkit';
import { Project } from 'ts-morph';
import * as utils from '../../shared/utils';
import { entityApiGenerator } from './generator';

jest.mock('enquirer', () => ({
  AutoComplete: jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue('mocked-lib-path'),
  })),
}));

jest.mock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  formatFiles: jest.fn(),
  generateFiles: jest.fn(),
}));

jest.mock('../../shared/utils', () => ({
  ...jest.requireActual('../../shared/utils'),
  getNxLibsPaths: jest.fn(),
  searchNxLibsPaths: jest.fn(),
  searchAliasPath: jest.fn(),
  addNamedImport: jest.fn(),
  appendFileContent: jest.fn(),
}));

// Mock ts-morph Project class
jest.mock('ts-morph', () => {
  const original = jest.requireActual('ts-morph');

  return {
    ...original,
    Project: jest.fn().mockImplementation(() => ({
      addSourceFileAtPath: jest.fn().mockReturnValue({
        getVariableDeclarationOrThrow: jest.fn().mockImplementation((name) => {
          if (name === 'rootReducer') {
            return {
              getInitializerIfKindOrThrow: jest.fn().mockReturnValue({
                addProperty: jest.fn(),
              }),
            };
          }

          if (name === 'middlewares') {
            return {
              getInitializerIfKindOrThrow: jest.fn().mockReturnValue({
                addElement: jest.fn(),
              }),
            };
          }

          return null;
        }),
      }),
      saveSync: jest.fn(),
    })),
  };
});

describe('entityApiGenerator', () => {
  const tree = {
    rename: jest.fn(),
  } as unknown as devkit.Tree;

  const options = {
    name: 'TestEntity',
    baseEndpoint: 'endpoint',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (utils.getNxLibsPaths as jest.Mock).mockReturnValue([
      'libs/data-access/api/src',
      'libs/data-access/api-client/src',
      'libs/data-access/store/src',
    ]);
    (utils.searchNxLibsPaths as jest.Mock).mockImplementation((_, search) => {
      if (search.includes('api-client')) {
        return ['libs/data-access/api-client/src'];
      }

      if (search.includes('api')) {
        return ['libs/data-access/api/src'];
      }

      if (search.includes('store')) {
        return ['libs/data-access/store/src'];
      }

      return [];
    });
    (utils.searchAliasPath as jest.Mock).mockImplementation((p) => `@alias/${p.split('/').slice(-3).join('/')}`);
  });

  it('should generate files, rename, append content, and update redux store', async () => {
    await entityApiGenerator(tree, options);

    const apiName = 'test-entity';
    const apiPath = `libs/data-access/api/src/lib/${apiName}`;

    // Should generate files with correct variables
    expect(devkit.generateFiles).toHaveBeenCalledWith(
      tree,
      path.join(__dirname, 'files'),
      apiPath,
      expect.objectContaining({
        apiName: 'testEntity',
        entityName: 'TestEntity',
        entityFileName: apiName,
        baseEndpoint: '/endpoint',
      }),
    );

    // Should rename model file
    expect(tree.rename).toHaveBeenCalledWith(`${apiPath}/models/entity.ts`, `${apiPath}/models/${apiName}.ts`);

    // Should append export to index.ts
    expect(utils.appendFileContent).toHaveBeenCalledWith(
      `libs/data-access/api/src/lib/index.ts`,
      expect.stringContaining(`export * from './${apiName}';`),
      tree,
    );

    // Should add named import, update rootReducer and middlewares
    const ProjectMock = Project as jest.MockedClass<typeof Project>;
    const projectInstance = ProjectMock.mock.results[0].value;
    expect(utils.addNamedImport).toHaveBeenCalledWith('testEntityApi', expect.any(String), expect.any(Object));

    const store = projectInstance.addSourceFileAtPath.mock.results[0].value;
    expect(store.getVariableDeclarationOrThrow).toHaveBeenCalledWith('rootReducer');
    expect(store.getVariableDeclarationOrThrow).toHaveBeenCalledWith('middlewares');

    // Should save project and format files
    expect(projectInstance.saveSync).toHaveBeenCalled();
    expect(devkit.formatFiles).toHaveBeenCalledWith(tree);
  });

  it('should throw error if no apiClientLibsPaths found', async () => {
    (utils.searchNxLibsPaths as jest.Mock).mockImplementation(() => []);

    await expect(entityApiGenerator(tree, options)).rejects.toThrow('Could not find API Client path.');
  });

  it('should throw error if no apiLibsPaths found', async () => {
    (utils.searchNxLibsPaths as jest.Mock).mockImplementation((paths, search) => {
      if (search.includes('api-client')) {
        return ['libs/data-access/api-client/src'];
      }

      return [];
    });

    await expect(entityApiGenerator(tree, options)).rejects.toThrow('Could not find API path.');
  });

  it('should throw error if no storeLibsPaths found', async () => {
    (utils.searchNxLibsPaths as jest.Mock).mockImplementation((paths, search) => {
      if (search.includes('api-client')) return ['libs/data-access/api-client/src'];
      if (search.includes('api')) return ['libs/data-access/api/src'];

      return [];
    });

    await expect(entityApiGenerator(tree, options)).rejects.toThrow('Could not find redux store path.');
  });

  it('should run AutoComplete prompt if multiple apiClientLibsPaths and apiLibsPaths', async () => {
    const mockRun = jest.fn().mockResolvedValue('chosen-path');
    const AutoCompleteMock = require('enquirer').AutoComplete;
    AutoCompleteMock.mockImplementationOnce(() => ({ run: mockRun }));
    AutoCompleteMock.mockImplementationOnce(() => ({ run: mockRun }));

    (utils.searchNxLibsPaths as jest.Mock).mockImplementation((paths, search) => {
      if (search.includes('api-client')) return ['path1', 'path2'];
      if (search.includes('api')) return ['path3', 'path4'];
      if (search.includes('store')) return ['storePath'];

      return [];
    });

    await entityApiGenerator(tree, options);

    expect(mockRun).toHaveBeenCalledTimes(2);
  });
});
