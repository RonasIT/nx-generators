# Example - Mobile app

React Native mobile app for Android and iOS.

## Scripts overview

See `package.json` for pre-defined scripts.\
You can run them using `npm run {script} -- {arguments}` or `yarn {script} {arguments}`:

- `start` - Start local development server
- `build:{environment}` - Create builds for _both_ platforms
  - Pass `-p {android|ios}` to run a platform-specific build
  - To create a [Development client](https://docs.expo.dev/develop/development-builds/introduction/) build run `build:debug`
- `submit:ios:{environment}` - Submit iOS build to AppStore Connect
- `update:{environment}` - Publish OTA-update for specified environment

## Development

This app uses [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/)
for local development.

### Run on a virtual device

- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/): `npm run android`
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/) (macOS is required): `npm run ios`

### Run on a physical device

1. Find the latest `debug`-profile build for your platform in Expo project or run `build:debug` script to create a new one.
1. Download the build artifact and install it on your device.
1. Run the `start` script to launch a local development server.
1. Connect to the server using dev-client you installed.

**Note**: For iOS you need to register your device first as [described](https://docs.expo.dev/build/internal-distribution/#setting-up-ad-hoc-provisioning).\
After that [resign](https://docs.expo.dev/app-signing/app-credentials/#re-signing-new-credentials) existing build or a create new one. This is required only once.

## Releases

### 1. Prepare

1. Increment `ios.buildNumber` and `android.versionCode` values and update `version` (if necessary) in `app.config.ts`
1. Commit the changes with version `v{version}-{buildNumber}`, for example: `chore: release v1.2.2-12`
1. Create or update version tag: `git tag v1.2.2-12`
1. Push changes: `git push && git push --tags`
1. Create new release in [Releases](../../../../-/releases) based on tag you pushed

### 2. Create builds

- `build:dev` - build development version for internal testing
- `build:prod` - build production version for stores

### 3. Distribute

#### Internal testing

- Android: share .apk builds with testers
- iOS: send created builds to Testflight using `submit:ios:dev`

#### Production

- Android: Download production build artifact and upload it to Google Play Console
- iOS: submit production builds App Store Connect using `submit:ios:prod`

### OTA updates

Minor fixes can be distributed over-the-air using [EAS Update](https://docs.expo.dev/eas-update/introduction/):

1. Update `version` in `app.config.ts`
2. Commit the changes
3. Publish OTA-update for desired environment: `update:dev` or `update:prod`
