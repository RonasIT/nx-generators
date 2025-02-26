export const dependencies = {
  'expo-app': {
    // TODO: Remove @react-native-async-storage/async-storage when it is deleted from @ronas-it/react-native-common-modules
    '@react-native-async-storage/async-storage': '~1.23.1',
    '@ronas-it/react-native-common-modules': '^0.6.2',
    'react-native-mmkv': '^3.2.0',
    'expo-constants': '~17.0.3',
    'expo-dev-client': '^5.0.6',
    'expo-router': '~4.0.14',
    'react-native-safe-area-context': '^4.12.0',
    'react-native-screens': '~4.4.0',
    'expo-linking': '~7.0.3',
    'expo-status-bar': '^2.0.0',
    'expo-updates': '^0.26.10',
    'expo-insights': '~0.8.1',
    'lodash-es': '^4.17.21',
  },
  'expo-app-root': {
    // Need new version to fix this error:
    // https://github.com/kristerkari/react-native-svg-transformer/issues/329
    'react-native-svg-transformer': '^1.4.0',
  },
  'next-app': {
    'next-intl': '^3.17.2',
  },
  'api-client': {
    '@ronas-it/axios-api-client': '^0.1.0',
  },
  auth: {
    luxon: '^3.4.4',
  },
  'rn-styles': {
    'react-native-extended-stylesheet': '^0.12.0',
  },
  store: {
    '@ronas-it/rtkq-entity-api': '^0.4.3',
    'react-redux': '^9.1.2',
  },
  'ui-kitten': {
    '@eva-design/eva': '^2.2.0',
    '@ui-kitten/components': '^5.3.1',
  },
  form: {
    '@hookform/resolvers': '^3.9.0',
    'react-hook-form': '^7.53.0',
    yup: '^1.4.0',
  },
  sentry: {
    expo: {
      '@sentry/react-native': '~6.6.0',
    },
    next: {
      '@sentry/nextjs': '^8.54.0',
    },
  },
};

export const devDependencies = {
  'code-checks': {
    '@eslint/compat': '^1.2.6',
    '@eslint/eslintrc': '^3.2.0',
    eslint: '^9.8.0',
    prettier: '^3.3.2',
    'eslint-config-prettier': '^9.1.0',
    'eslint-import-resolver-typescript': '^3.7.0',
    'eslint-plugin-import': '^2.29.1',
    'eslint-plugin-jsx-a11y': '^6.9.0',
    'eslint-plugin-react': '^7.34.3',
    'eslint-plugin-react-hooks': '^5.0.0',
    'eslint-plugin-unused-imports': '^4.1.4',
    husky: '^9.1.5',
    '@stylistic/eslint-plugin': '^2.12.1',
    '@typescript-eslint/eslint-plugin': '^8.18.1',
    '@typescript-eslint/parser': '^8.18.1',
    'tsc-files': '^1.1.4',
  },
  'expo-app': {
    '@types/lodash': '^4.14.194',
  },
  'expo-app-root': {
    'cross-env': '^7.0.3',
  },
  'next-app': {
    // nx/next 20 adds package that doesn't support eslint 9
    'eslint-config-next': '^15.1.6',
  },
  'repo-config': {
    syncpack: '^12.3.2',
  },
  auth: {
    '@types/luxon': '3.4.2',
  },
};
