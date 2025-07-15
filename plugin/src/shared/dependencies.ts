export const dependencies = {
  'expo-app': {
    '@ronas-it/react-native-common-modules': '~1.0.0',
    'react-native-mmkv': '~3.2.0',
    'expo-constants': '~17.1.6',
    'expo-dev-client': '~5.2.0',
    'expo-router': '~5.1.0',
    'react-native-safe-area-context': '~5.4.0',
    'react-native-screens': '~4.11.1',
    expo: '~53.0.1',
    'expo-linking': '~7.1.5',
    'expo-status-bar': '~2.2.3',
    'expo-updates': '~0.28.14',
    'expo-insights': '~0.9.3',
    'expo-localization': '~16.1.6',
    'i18n-js': '~4.5.1',
    'lodash-es': '^4.17.21',
    react: '~19.0.0',
    'react-native': '~0.79.0',
    'react-native-svg': '~15.11.2',
    'react-native-svg-transformer': '~1.5.1',
  },
  'next-app': {
    'next-intl': '^4.1.0',
    'lodash-es': '^4.17.21',
    'class-transformer': '^0.5.1',
  },
  'api-client': {
    '@ronas-it/axios-api-client': '^0.1.2',
  },
  auth: {
    luxon: '^3.6.1',
  },
  'rn-styles': {
    'react-native-extended-stylesheet': '^0.12.0',
  },
  store: {
    '@ronas-it/rtkq-entity-api': '^0.4.11',
    'react-redux': '^9.2.0',
  },
  'ui-kitten': {
    '@eva-design/eva': '^2.2.0',
    '@ui-kitten/components': '^5.3.1',
  },
  form: {
    '@hookform/resolvers': '^5.1.1',
    'react-hook-form': '^7.57.0',
    yup: '^1.6.1',
  },
  sentry: {
    expo: {
      '@sentry/react-native': '~6.14.0',
    },
    next: {
      '@sentry/nextjs': '^9.28.1',
    },
  },
};

export const devDependencies = {
  'code-checks': {
    '@eslint/compat': '^1.3.0',
    '@eslint/eslintrc': '^3.3.1',
    eslint: '^9.28.0',
    prettier: '^3.5.3',
    'eslint-config-prettier': '^10.1.5',
    'eslint-import-resolver-typescript': '^4.4.3',
    'eslint-plugin-import': '^2.31.0',
    'eslint-plugin-jsx-a11y': '^6.10.2',
    'eslint-plugin-react': '^7.37.5',
    'eslint-plugin-react-hooks': '^5.2.0',
    'eslint-plugin-unused-imports': '^4.1.4',
    husky: '^9.1.7',
    '@stylistic/eslint-plugin': '^4.4.1',
    '@typescript-eslint/eslint-plugin': '^8.34.0',
    '@typescript-eslint/parser': '^8.34.0',
    'tsc-files': '^1.1.4',
  },
  'expo-app': {
    '@types/lodash-es': '^4.17.12',
    '@expo/cli': '~0.24.16',
    'reactotron-react-native': '~5.1.14',
    'reactotron-redux': '~3.2.0',
    metro: '^0.82.0',
    'metro-config': '^0.82.0',
  },
  'next-app': {
    // nx/next 20 adds package that doesn't support eslint 9
    'eslint-config-next': '^15.3.3',
    '@types/lodash-es': '^4.17.12',
  },
  'repo-config': {
    syncpack: '^13.0.4',
    'cross-env': '^7.0.3',
  },
  auth: {
    '@types/luxon': '3.6.2',
  },
};
