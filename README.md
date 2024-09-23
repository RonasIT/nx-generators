# NX Generators

NX generators for Ronas IT projects.

## Usage

1. Create monorepo with Expo app using [NX Expo preset](https://nx.dev/nx-api/expo) or with Next.js app using [NX Next preset](https://nx.dev/nx-api/next):

```sh
# For Expo app:
npx create-nx-workspace@latest my-project --preset=expo --appName=my-app --e2eTestRunner=none --ci=skip

# For Next.js app:
npx create-nx-workspace@latest my-project --preset=next --appName=my-app --nextAppDir=true --nextSrcDir=false --style=scss --e2eTestRunner=none --ci=skip
```

2. Install this package:

```sh
npm i @ronas-it/nx-generators --save-dev
```

3. Run generators:

```sh
npx nx g repo-config
npx nx g code-checks

# For Expo app:
npx nx g expo-app

# For Next.js app:
npx nx g next-app
```

Or run all generators at once:

```sh
# For Expo app:
npx nx g repo-config && npx nx g code-checks && npx nx g expo-app

# For Next.js app:
npx nx g repo-config && npx nx g code-checks && npx nx g next-app
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

Generates and configures an Expo React Native app.

#### Options

1. `name` (optional) - name of the app for `app.config.ts` (e.g: `my-app`)

2. `directory` (optional) - name of the directory in the `apps/` folder (e.g: `mobile`)

#### Example

```sh
npx nx g expo-app --name=my-app --directory=mobile
```
or
```sh
npx nx g expo-app my-app mobile
```

### 4. `next-app`

Generates and configures a Next.js app.

#### Options

1. `name` (optional) - name of the app (e.g: `my-app`)

2. `directory` (optional) - name of the directory in the `apps/` folder (e.g: `web`)

#### Example

```sh
npx nx g next-app --name=my-app --directory=web
```
or
```sh
npx nx g next-app my-app web
```

### 5. `react-lib`

Generates a library according to [NX notation](https://nx.dev/concepts/more-concepts/applications-and-libraries).

#### Options

1. `directory` (optional) - directory for the library (e.g. mobile/account/features/profile-settings)

2. `withComponent` (optional) - generate the library with `lib/component.tsx` file

3. `dryRun` (optional) - generate the library without creating files

#### Example

```sh
npx nx g react-lib --directory=mobile/account/features/profile-settings --withComponent --dryRun
```
or
```sh
npx nx g react-lib mobile/account/features/profile-settings --withComponent --dryRun
```

### 6. `react-component`

Creates a React component in particular library.

#### Options

1. `name` (optional) - name of the component (e.g. AppButton)

2. `subcomponent` (optional) - generate a folder for components

#### Example

```sh
npx nx g react-component --name=AppButton --subcomponent
```
or
```sh
npx nx g react-component AppButton --subcomponent
```

### 7. `entity-api`

Creates an API with related entities in API library. It also updates redux store middlewares, reducers.

#### Options

1. `name` (optional) - name of the entity (e.g. User)

2. `baseEndpoint` (optional) - name of used endpoint in your API (e.g. /users)

#### Example

```sh
npx nx g entity-api --name=User --baseEndpoint=users
```

### 8. `form`

Generates a form schema class and adds its usage to a component or a hook.

#### Options

1. `name` (optional) - name of the form (e.g: `profile-settings`)

2. `placeOfUse` (optional) - name of the component or hook, where the form should be
   (e.g: `ProfileSettings` or `useProfileSettings`)

#### Example

```sh
npx nx g form --name=profile-settings --placeOfUse=ProfileSettings
```
or
```sh
npx nx g form profile-settings ProfileSettings
```

### Note

Each generator accepts the `--help` argument to see generator instructions.

```sh
npx nx g react-lib --help
```
