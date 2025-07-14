export default {
  'lint-staged': {
    '*.{ts,tsx}': 'tsc-files --noEmit types.d.ts',
    '*.{ts,tsx,js,html,json,md}': 'prettier --write',
    '*.{ts,tsx,js}': 'eslint --cache --fix',
  },
  tsconfig: {
    baseUrl: '.',
    rootDir: '.',
    sourceMap: true,
    declaration: true,
    declarationMap: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    jsx: 'react-native',
    allowJs: true,
    strict: true,
    allowSyntheticDefaultImports: true,
    noImplicitAny: true,
    strictPropertyInitialization: false,
    strictNullChecks: true,
  },
  tsConfigExclude: ['**/*.cjs', '**/*.mjs', 'node_modules', 'dist'],
};
