export default {
  start: 'cross-env EXPO_PUBLIC_APP_ENV=development npx expo start',
  'start:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production npx expo start',
  'build:dev': 'eas build --no-wait -p all --profile=development',
  'build:internal': 'npm run build:dev -- --profile=internal',
  'build:debug': 'npm run build:dev -- --profile=debug',
  'build:prod': 'npm run build:dev -- --profile=production',
  'update:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas update --branch development',
  'update:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas update --branch production',
  'submit:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas submit --no-wait --profile=development',
  'submit:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas submit --no-wait --profile=production',
  android: 'npx expo run:android',
  ios: 'npx expo run:ios',
};
