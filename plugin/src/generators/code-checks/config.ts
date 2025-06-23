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
    declaration: false,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    jsx: 'react-native',
    allowJs: true,
    noEmit: true,
    strict: true,
    allowSyntheticDefaultImports: true,
    noImplicitAny: true,
    strictPropertyInitialization: false,
    strictNullChecks: true,
    exclude: ['**/*.cjs', '**/*.mjs', 'node_modules', 'dist'],
  },
};
