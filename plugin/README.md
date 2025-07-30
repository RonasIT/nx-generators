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

**Expo app:**

```sh
npx create-nx-workspace@latest my-project --preset=expo --appName=my-app --e2eTestRunner=none --unitTestRunner=none --formatter=prettier --linter=eslint --ci=skip
```

**Next.js app:**

```sh
npx create-nx-workspace@latest my-project --preset=next --appName=my-app --nextAppDir=true --unitTestRunner=none --formatter=prettier --linter=eslint --nextSrcDir=false --style=scss --e2eTestRunner=none --ci=skip
```

2. Install this package:

```sh
npm i @ronas-it/nx-generators --save-dev
```

3. Run generators:

Configure workspace:

```sh
npx nx g repo-config && npx nx g code-checks
```

Then run app generators:

**Expo app:**

```sh
npx nx g expo-app
```

**Next.js app:**

```sh
npx nx g next-app
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

Also, you can run unit tests using `npx nx test nx-generators`

### Repository

### 1. `repo-config`

Sets up the monorepo structure for development.

### 2. `code-checks`

Configures code checks and formatting with pre-commit hook.

### Apps

### 3. `expo-app`

Generates and configures an Expo React Native app.
Also generates [navigation utilities](#navigation-utilities)

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
Also generates [navigation utilities](#navigation-utilities).

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

1. `dryRun` (optional) - generate the library without creating files

#### Example

```sh
npx nx g react-lib --app=mobile --scope=account --type=features --name=profile-settings --withComponent --dryRun
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

#### Example

```sh
npx nx g react-component --name=AppButton --subcomponent
```

or

```sh
npx nx g react-component AppButton --subcomponent
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

## Navigation utilities

The generators `next-app` and `expo-app` also create customizable utilities for navigation
and empty `navigationConfig` - an object, where routes should be stored.
There are utilities, which may help to create routes

### getLinkBuilder

It's a function for building URLs based on a base path and optional query parameters.
Library - `navigation`.

#### Parameters

- `basePath` — the initial URL. It may contain placeholders for dynamic substitution (e.g., `[id]`).

#### Returns

`() => string` or `(args?: TRootParams) => string` - a function that constructs a URL by replacing placeholders in the `basePath`
with values from an optional args object and appends query parameters.

#### Example of usage

```ts
export class ItemSearchParams {
  @Expose()
  public categoryId?: number;

  @Expose()
  public tags?: Array<string>;
}

const navigationConfig = {
  routes: {
    items: getLinkBuilder<ItemSearchParams>('/items'),
  },
};

// /items
const allItemsLink = navigationConfig.routes.items();
// /items?categoryId=1&tags=fiction&tags=newest
const filteredItemsLink = navigationConfig.routes.items({
  categoryId: 1,
  tags: ['fiction', 'newest'],
});
```

### getResourcePaths

It's a function that generates an object of URL paths related to a specific resource:
list, single view, creation, and editing.
Library - `navigation`.

#### Parameters

- `basePath` - the root path for the resource.
- `options` (optional) - an object to enable additional paths.
  - `withCreation` (optional) includes a path for creation a new resource.
  - `withEditing` (optional) includes a path for editing an existing resource.

#### Returns

`ResourcePaths<TRootParams>` - an object containing URL path builders for various resource operations:

- `list` - a function to generate the listing URL, supporting query parameters like a result of [getLinkBuilder](#getlinkbuilder).
- `view` - a function to generate a URL for viewing a specific resource by its id.
- `create` (optional) - URL string for the creation page, if `withCreation` is enabled.
- `edit` (optional) - a function to generate a URL for editing a specific resource by its id, if `withEditing` is enabled.

#### Example of usage

```ts
export class ItemSearchParams {
  @Expose()
  public categoryId?: number;

  @Expose()
  public tags?: Array<string>;
}

const navigationConfig = {
  routes: {
    items: getResourcePaths<ItemSearchParams>('/items', {
      withCreation: true,
      withEditing: true,
    }),
  },
};

const allItemsLink = navigationConfig.routes.items.list(); // /items
const filteredItemsLink = navigationConfig.routes.items.list({
  // /items?categoryId=1&tags=fiction&tags=newest
  categoryId: 1,
  tags: ['fiction', 'newest'],
});
const viewLink = navigationConfig.routes.items.view(1); // /items/1
const creationLink = navigationConfig.routes.items.create; // /items/create
const editingLink = navigationConfig.routes.items.edit?.(1); // /items/1/edit
```

### useFilteringSearchParams (web only)

It's a hook, which converts query parameters to and from a specified model for filtering purposes.
It calls `useSearchParams` from `next/navigation` under the hook.
Library - `filtering-search-params`

#### Parameters

- `searchParamsConstructor` - a class constructor used to instantiate the type `TParams` from the parsed search parameters.

#### Returns

An object containing:

- `initialSearchParams` - search parameters, instantiated from `searchParamsConstructor`.
- `setSearchParams` - a function to update the URL with new search parameters, accepting an instance of `TParams`.

#### Example of usage

```ts
export class ItemSearchParams {
  @Expose()
  public categoryId?: number;

  @Expose()
  public tags?: Array<string>;
}

// It's necessary to add ItemSearchParams to this union type
// so that the hook can accept ItemSearchParams
export type FilteringSearchParams = ItemSearchParams;

const { initialSearchParams, setSearchParams } = useFilteringSearchParams<ItemSearchParams>({
  searchParamsConstructor: ItemSearchParams,
});

setSearchParams({ categoryId: 5 });
```
