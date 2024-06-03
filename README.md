# NX Generators

NX generators for Ronas IT projects.

At the moment this library contains the following generators:

1. `repo-config` - setups the monorepo structure for React Native development.
2. `code-checks` - configures code checks and formatting with pre-commit hook.
3. `expo-app` - generates and configures Expo React Native app.
4. `react-lib` - generates a library according to [NX notation](https://nx.dev/concepts/more-concepts/applications-and-libraries).
5. `react-component` - creates a React component in particular library.

## Usage

1. Create monorepo with Expo app using [NX preset](https://nx.dev/nx-api/expo):

```sh
npx create-nx-workspace@latest my-project --preset=expo --appName=my-app --e2eTestRunner=none --ci=skip
```

2. Install this package:

```sh
npm i @ronas-it/nx-generators --save-dev
```

3. Run generators:

```sh
npx nx g repo-config
npx nx g code-checks
npx nx g expo-app
```

Or run all generators at once:

```sh
npx nx g repo-config && npx nx g code-checks && npx nx g expo-app
```

4. Start the app:

```sh
npx nx start my-app
```

5. Continue developing your app by generating libraries and components:

```sh
npx nx g react-lib mobile/account/features/profile-settings --withComponent
npx nx g react-component
```

Each generator accepts the `--help` argument to see generator instructions.

```sh
npx nx g react-lib --help
```
