export const dependencies = {
  'expo-app': {
    "@ronas-it/react-native-common-modules": "^0.4.0",
    'expo-constants': '~16.0.2',
    'expo-router': '~3.5.16',
    'react-native-safe-area-context': '^4.10.5',
    'react-native-screens': '^3.32.0',
    'expo-linking': '^6.3.1',
    'expo-status-bar': '^1.12.1',
    'expo-updates': '^0.25.17',
    'expo-insights': '~0.7.0',
    "lodash-es": "^4.17.21"
  },
  'expo-app-root': {
    // Need new version to fix this error:
    // https://github.com/kristerkari/react-native-svg-transformer/issues/329
    'react-native-svg-transformer': '^1.4.0'
  },
  'next-app': {
    'next-intl': '^3.17.2',
  },
  'api-client': {
    '@ronas-it/axios-api-client': '^0.1.0',
  },
  'auth': {
    'luxon': '^3.4.4'
  },
  'rn-styles': {
    'react-native-extended-stylesheet': '^0.12.0'
  },
  'store': {
    '@ronas-it/rtkq-entity-api': '^0.3.1',
    'react-redux': '^9.1.2'
  },
  'ui-kitten': {
    '@eva-design/eva': '^2.2.0',
    '@ui-kitten/components': '^5.3.1'
  }
};

export const devDependencies = {
  'code-checks': {
    'eslint': '^8.56.0',
    'prettier': '^3.3.2',
    'eslint-config-prettier': '^9.1.0',
    'eslint-import-resolver-typescript': '^3.6.1',
    'eslint-plugin-import': '^2.29.1',
    'eslint-plugin-jsx-a11y': '^6.9.0',
    'eslint-plugin-react': '^7.34.3',
    'eslint-plugin-react-hooks': '^4.6.2',
    'eslint-plugin-react-native': '^4.1.0',
    'eslint-plugin-unused-imports': '^3.0.0',
    '@typescript-eslint/eslint-plugin': '^7.13.1',
    '@typescript-eslint/parser': '^7.13.1',
    'tsc-files': '^1.1.4',
  },
  'expo-app': {
    '@types/lodash': '^4.14.194',
  },
  'expo-app-root': {
    'cross-env': '^7.0.3'
  },
  'repo-config': {
    'syncpack': '^12.3.2',
  },
  'auth': {
    '@types/luxon': '3.4.2'
  }
};
