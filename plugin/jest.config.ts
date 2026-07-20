import type { Config } from 'jest';

const config: Config = {
  displayName: 'nx-generators',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/shared/tests-utils/setup-nx-utils-mock.ts'],
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^typescript$': '<rootDir>/../node_modules/typescript',
  },
  testMatch: ['**/*.spec.ts'],
};

export default config;
