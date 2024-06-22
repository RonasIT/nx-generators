export default {
  'start': 'npx expo start',
  'start:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production npx expo start',
  'build:dev': 'eas build --no-wait -p all --profile=development',
  'build:debug': 'npm run build:dev -- --profile=debug',
  'build:prod': 'npm run build:dev -- --profile=production',
  'update:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas update --branch development',
  'update:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas update --branch production',
  'submit:ios:dev': 'cross-env EXPO_PUBLIC_APP_ENV=development eas submit --no-wait -p ios --profile=development',
  'submit:ios:prod': 'cross-env EXPO_PUBLIC_APP_ENV=production eas submit --no-wait -p ios --profile=production',
};
