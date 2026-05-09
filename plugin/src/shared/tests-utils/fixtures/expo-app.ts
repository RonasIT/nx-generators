export const expoRootLayoutMinimal = `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
`;

export const expoAppConfigMinimal = `import type { ExpoConfig } from '@expo/config';

const createConfig = (): ExpoConfig => {
  const extra = {
    eas: {},
  };

  return {
    name: 'Test',
    plugins: ['expo-router'],
    extra,
  };
};

export default createConfig;
`;

export const expoMetroMinimal = `const { getDefaultConfig } = require('expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

module.exports = defaultConfig;
`;
