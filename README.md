# NX Generators

NX generators for Ronas IT projects.

## Usage

1. Create monorepo with Expo app using [NX Expo preset](https://nx.dev/nx-api/expo) or with Next.js app using [NX Next preset](https://nx.dev/nx-api/next):

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
npx nx g expo-app // for Expo app
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

## Generators overview

### 1. `repo-config`

Setups the monorepo structure for development.

### 2. `code-checks`

Configures code checks and formatting with pre-commit hook.

### 3. `expo-app`

Generates and configures Expo React Native app.

### Options

1. `name` (not required) - name of the app for app.config.ts (e.g: my-app)

2. `directory` (not required) - name of the directory in the 'apps/' folder (e.g: mobile)

### Example

```sh
npx nx g expo-app --name=my-app --directory=mobile
```
or
```sh
npx nx g expo-app my-app mobile
```

### 4. `react-lib`

Generates a library according to [NX notation](https://nx.dev/concepts/more-concepts/applications-and-libraries).

### Options

1. `directory` (not required) - directory for the library (e.g. mobile/account/features/profile-settings)

2. `withComponent` (not required) - generate the library with 'lib/component.tsx' file

3. `dryRun` (not required) - generate the library without creating files

### Example

```sh
npx nx g react-lib --directory=mobile/account/features/profile-settings --withComponent --dryRun
```
or
```sh
npx nx g react-lib mobile/account/features/profile-settings --withComponent --dryRun
```

### 5. `react-component`

Creates a React component in particular library.

### Options

1. `name` (not required) - name of the component (e.g. AppButton)

2. `subcomponent` (not required) - generate a folder for components

### Example

```sh
npx nx g react-component --name=AppButton --subcomponent
```
or
```sh
npx nx g react-component AppButton --subcomponent
```

Each generator accepts the `--help` argument to see generator instructions.

```sh
npx nx g react-lib --help
```
