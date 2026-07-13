export default {
  start: 'cross-env EXPO_PUBLIC_APP_ENV=development npx expo start',
  'start:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production npx expo start',
  'build:dev': 'eas build --no-wait --profile=development',
  'build:internal': 'eas build --no-wait --profile=internal',
  'build:debug': 'eas build --no-wait --profile=debug',
  'build:prod': 'eas build --no-wait --profile=production',
  'update:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas update --branch development',
  'update:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas update --branch production',
  'submit:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas submit --no-wait --profile=development',
  'submit:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas submit --no-wait --profile=production',
  android: 'cross-env EXPO_PUBLIC_APP_ENV=development npx expo run:android',
  ios: 'cross-env EXPO_PUBLIC_APP_ENV=development npx expo run:ios',
};
