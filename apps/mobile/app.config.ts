import { EASConfig, ExpoConfig } from '@expo/config';

const createConfig = (): Omit<ExpoConfig, 'extra'> & {
  extra: { eas: EASConfig } & typeof extra;
} => {
  const projectId = '3b4b782c-cea9-44f1-8928-13b5c11153fe';

  const appId = 'com.example.dev';

  const extra = {
    eas: { projectId } as EASConfig,
  };

  return {
    name: 'Example Dev',
    slug: 'example-dev',
    scheme: 'example-dev',
    version: '0.1.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    runtimeVersion: {
      policy: 'appVersion',
    },
    updates: {
      url: `https://u.expo.dev/${projectId}`,
    },
    ios: {
      bundleIdentifier: appId,
      supportsTablet: false,
      buildNumber: '1',
      config: {
        usesNonExemptEncryption: false,
      },
    },
    android: {
      package: appId,
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
    },
    plugins: [
      'expo-router',
      'expo-localization',
      [
        'expo-splash-screen',
        {
          image: './assets/splash-icon.png',
          backgroundColor: '#1B1A19',
        },
      ],
    ],
    extra,
  };
};

export default createConfig;
