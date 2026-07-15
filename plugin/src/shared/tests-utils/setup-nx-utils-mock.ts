/// <reference types="jest" />

jest.mock('../utils/nx-utils', () => ({
  ...jest.requireActual('../utils/nx-utils'),
  nxAddCommand: jest.fn(),
}));
