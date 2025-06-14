# Nx Generators

This package provides a set of [Nx](https://nx.dev/getting-started/intro) generators that help maintain a consistent project structure, enforce best practices, and automate common development tasks. It is designed to streamline and standardize the development workflow for monorepos with React Native and/or Next.js apps.

## Features

- **Automated setup**: Quick setup of new projects with pre-configured [best practices](#best-practices)
- **Cross-platform support**: Generators for both web (Next.js) and mobile (RN Expo) applications
- **Code quality tools**: Built-in configuration for ESLint, Prettier, and TypeScript pre-commit checks
- **Library management**: Tools for creating, moving, renaming, and managing libraries with pre-defined boundaries
- **Component generation**: Automated creation of components, form interaction, and other utility tools
- **Data access setup**: State management and API interaction setup using [Redux Toolkit](https://redux-toolkit.js.org/) and [RTKQ Entity API](https://github.com/RonasIT/rtkq-entity-api)
- **Internationalization**: Built-in support for i18n in both Next.js and RN Expo applications

See full list of generators [below](#generators-overview).

## Best Practices

The generators enforce several best practices according to [Nx concepts](https://nx.dev/concepts/decisions):

- Scalable [monorepo organization](https://nx.dev/concepts/decisions/why-monorepos)
- Consistent [project structure](https://nx.dev/concepts/decisions/folder-structure)
- Clear [libraries hierarchy](https://nx.dev/concepts/decisions/project-dependency-rules)
- Proper [module boundaries](https://nx.dev/features/enforce-module-boundaries)
- Streamlined [dependency management](https://nx.dev/concepts/decisions/dependency-management)

## Usage

1. Create monorepo with Expo app using [Nx Expo preset](https://nx.dev/nx-api/expo) or with Next.js app using [Nx Next preset](https://nx.dev/nx-api/next):

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

Note: each generator accepts the `--help` argument to see generator instructions. Example: `npx nx g react-lib --help`.

### Repository

### 1. `repo-config`

Sets up the monorepo structure for development.

### 2. `code-checks`

Configures code checks and formatting with pre-commit hook.

### Apps

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

### Libraries

### 5. `react-lib`

Generates a library according to [Nx notation](https://nx.dev/concepts/decisions/project-dependency-rules).

#### Options

1. `app` (optional) - name of an app or `shared`.

1. `scope` (optional) - name of a scope or `shared`.
   This option is for a library, related to an app.

1. `type` (optional) - type of library.
   Possible values are `features`, `data-access`, `ui` and `utils`.

1. `name` (optional) - name of a library.

1. `withComponent` (optional) - generate the library with `lib/component.tsx` file.
   This option is for `features` or `ui` library.

1. `withComponentForwardRef` (optional) - generate a component with `forwardRef` in `lib/component.tsx` file.
   This option works if `withComponent` is `true`.

1. `dryRun` (optional) - generate the library without creating files

#### Example

```sh
npx nx g react-lib --app=mobile --scope=account --type=features --name=profile-settings --withComponent --withComponentForwardRef --dryRun
```

or

```sh
npx nx g react-lib --dryRun
```

### 6. `lib-rename`

Renames an existing library and updates imports

#### Options

1. `currentLibName` (optional) - name of the library (e.g.: `mobile-account-features-profile-settings`)

2. `newLibName` (optional) - new name of the library (e.g.: `user-settings`, project name will be `mobile-account-features-user-settings`)

#### Example

```sh
npx nx g lib-rename --currentLibName="mobile-account-features-profile-settings" --newLibName="user-settings"
```

### 7. `lib-move`

Moves the library to a new destination. This utility also calls `lib-tags` generator.

#### Options

1. `srcLibName` (optional) - name of the library (e.g.: `mobile-account-features-profile-settings`)

2. `app` (optional) - name of an app or `shared`.

3. `scope` (optional) - name of a scope or `shared`.
   This option is for a library, related to an app.

4. `type` (optional) - type of library.
   Possible values are `features`, `data-access`, `ui` and `utils`.

5. `name` (optional) - name of a library.

#### Example

```sh
npx nx g lib-move --srcLibName="mobile-account-features-profile-settings" --app=mobile --scope=settings --type=features --name="user-settings"
```

### 8. `lib-remove`

Removes the library. Before deleting a library you must remove all references to it.

#### Options

1. `libName` (optional) - name of the library (e.g.: `mobile-account-features-profile-settings`)

#### Example

```sh
npx nx g lib-remove --libName="mobile-account-features-profile-settings"
```

### 9. `lib-tags`

Checks and configures [Nx library tags](https://nx.dev/features/enforce-module-boundaries). If your project does not already use library tags, you can add them using this generator.

#### Options

1. `silent` (optional) - disables all logs

2. `skipRepoCheck` (optional) - disables check repository status

#### Example

```sh
npx nx g lib-tags
```

### Components

### 10. `react-component`

Creates a React component in particular library.

#### Options

1. `name` (optional) - name of the component (e.g. AppButton)

2. `subcomponent` (optional) - generate a folder for components

3. `withForwardRef` (optional) - generate a component with forwardRef

#### Example

```sh
npx nx g react-component --name=AppButton --subcomponent --withForwardRef
```

or

```sh
npx nx g react-component AppButton --subcomponent --withForwardRef
```

### 11. `form`

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

### Services

### 12. `entity-api`

Creates an API with related entities in API library. It also updates redux store middlewares, reducers.

#### Options

1. `name` (optional) - name of the entity (e.g. User)

2. `baseEndpoint` (optional) - name of used endpoint in your API (e.g. /users)

#### Example

```sh
npx nx g entity-api --name=User --baseEndpoint=users
```

### 13. `sentry`

Creates [Sentry](https://sentry.io/) integration for Expo/Next application.

#### Options

1. `directory` (optional) - the application directory that uses Sentry

2. `dsn` (optional) - [Data Source Name](https://docs.sentry.io/concepts/key-terms/dsn-explainer/) of your Sentry project

### 14. `dockerfile`

Generates a deployment-ready Dockerfile for Next.js applications in the monorepo.
