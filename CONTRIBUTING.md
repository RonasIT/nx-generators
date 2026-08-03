# Contributing

This document provides guidelines for contributing to this project.

## Development

### Example app

An example React Native application is included in the `apps/mobile` directory and its associated libraries in the `libs` directory. This example:

- Demonstrates the capabilities of all available generators
- Showcases the recommended repository structure and organization
- Provides practical examples of library usage and best practices
- Serves as a testing ground for generator development

The example app uses [DummyJSON](https://dummyjson.com/docs) for API interaction demonstration. Test credentials: `emilys` | `emilyspass`.

To run the example app locally, run in the repo root:

```sh
npx nx start example
```

Or run from the app directory:

```sh
cd apps/mobile
npm run start
```

### Local development

The `plugin` directory contains the source code for all generators in this package. Here's how to contribute:

1. **Modify generator code**
   - Navigate to `plugin/src` directory
   - Add new or edit the existing generator source code
   - Follow the existing code style and patterns

2. **Update generator metadata**
   - If you've added new options or changed generator behavior, update the corresponding entries in `plugin/generators.json`, and ensure all options are properly documented

3. **Test your changes**
   - Run generators locally to verify functionality, for example: `npx nx g expo-app`
   - Run unit tests using `npx nx test nx-generators`

4. **Run E2E tests before submitting a PR**

   Run `npm run test:e2e` to launch an automated happy-path check (`e2e/run.mjs`, cross-platform — works on macOS, Linux, and Windows). It:

   - builds the package and publishes it to a local [Yalc](https://github.com/wclr/yalc) store
   - creates a fresh Nx workspace
   - runs `repo-config`, `code-checks`, `expo-app`, and `next-app` with all optional flags enabled (except Sentry generators)
   - verifies that `npm run lint` passes in the generated workspace

   The test workspace is kept at `e2e/.workspace/e2e-workspace` for inspection after a run. The same check runs in CI on push to `main`, `master`, and `development`.

5. **Test package preview (Optional)**
   - Change version in `plugin/package.json` to an alpha version, for example: `"0.18.1-alpha.1"`
   - Build package locally: `npm run build`
   - Release alpha version of the package: `npm run release -- --tag=alpha`
   - Install the package in your test environment: `npm i @ronas-it/nx-generators@alpha --save-dev`

6. **Test locally in another project with Yalc (Optional)**
   - [Yalc](https://github.com/wclr/yalc) is a small local package store so other repos can depend on your build without publishing to npm. Install once: `npm i yalc -g`
   - From the repository root run `npm run build`, then `cd dist/nx-generators` and `yalc publish` (publish this folder, not `plugin/` — it matches what npm ships)
   - In the consumer project run `yalc add @ronas-it/nx-generators`
   - When you iterate here, publish again from `dist/nx-generators`, or use `yalc publish --push` to refresh existing installs

7. **Submit changes**
   - Create a pull request with your modifications
   - Include clear descriptions of changes
   - Reference any related issues or discussions

### Updating dependencies

There are two places that need updating together: the example apps (`apps/mobile`, `apps/web`)
and the generators (`plugin/src/shared/dependencies.ts`), which have the same versions hardcoded
so that newly generated projects also get up-to-date packages.

1. **Run the [`update-dependencies`](.agents/skills/update-dependencies/SKILL.md) skill** —
   ask your AI coding agent to update dependencies, and it will update the example apps,
   propagate the new versions into `plugin/src/shared/dependencies.ts` and `plugin/package.json`,
   and run the tests and linting checks. By default, it updates all possible dependencies.
   If you wish to update or not update specific dependencies, you can tell the skill about it.
2. Manually click through `apps/mobile`, `apps/web` and the plugin to make sure nothing broke.

## Repository guidelines

### Branch naming

Use descriptive branch names and follow [Conventional Branch](https://conventional-branch.github.io/) guidelines.

### Commit messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) format

### Code checks

Repository has pre-commit code style and correctness checks. You can run them manually using `lint` and `format` scripts.

### Pull request process

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Test your changes** thoroughly — run unit tests (`npm test`) and E2E tests (`npm run test:e2e`) when generator behavior may be affected
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Releases

To create a new release:

1. **Bump the version**: In the `plugin` directory run `npm version {patch|minor|major}` to update the version number in `package.json` and create a git commit and tag
   - `patch`: Bug fixes (0.2.0 → 0.2.1)
   - `minor`: New features (0.2.0 → 0.3.0)
   - `major`: Breaking changes (0.2.0 → 1.0.0)

2. **Push changes**: Create commit, tag and push them to the repository:

   ```bash
   git commit -m "chore: release v0.18.0"
   git push && git push --tags
   ```

3. **Create GitHub release**: Go to the [GitHub Releases](../../releases) page and:
   - Click "Create a new release"
   - Select the tag created in step 1
   - Add release notes describing the changes
   - Click "Publish release"

4. **Automatic NPM publication**: Once the GitHub release is published, the package will be automatically published to NPM via GitHub Actions workflow.

> **Note**: Make sure you have the `NPM_TOKEN` secret configured in your repository settings for the NPM publication to work.
