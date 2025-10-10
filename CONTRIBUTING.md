# Contributing

This document provides guidelines for contributing to this project.

## Development

### Example app

An example React Native application is included in the `apps/mobile` directory and its associated libraries in the `libs` directory. This example:

- Demonstrates the capabilities of all available generators
- Showcases the recommended repository structure and organization
- Provides practical examples of library usage and best practices
- Serves as a testing ground for generator development

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

2. **Test your changes**
   - Run generators locally to verify functionality, for example: `npx nx g expo-app`
   - Run unit tests using `npx nx test nx-generators`

3. **Update generator metadata**
   - If you've added new options or changed generator behavior, update the corresponding entries in `plugin/generators.json`, and ensure all options are properly documented

4. **Submit changes**
   - Create a pull request with your modifications
   - Include clear descriptions of changes
   - Reference any related issues or discussions

## Repository guidelines

### Branch naming

Use descriptive branch names:

- `feat/add-new-export-format`
- `fix/handle-missing-tokens`
- `docs/update-readme`

### Commit messages

Follow conventional commit format:

- `feat: add support for CSS custom properties`
- `fix: handle empty design tokens gracefully`
- `docs: update installation instructions`
- `refactor: simplify token processing logic`

### Pull request process

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Test your changes** thoroughly
4. **Update documentation** if needed
5. **Submit a pull request** with a clear description

## Releases

To create a new release:

1. **Bump the version**: Run `npm version {patch|minor|major}` to update the version number in `package.json` and create a git commit and tag
   - `patch`: Bug fixes (0.2.0 → 0.2.1)
   - `minor`: New features (0.2.0 → 0.3.0)
   - `major`: Breaking changes (0.2.0 → 1.0.0)

2. **Push changes**: Push the commit and tag to the repository:

   ```bash
   git push && git push --tags
   ```

3. **Create GitHub release**: Go to the [GitHub Releases](../../releases) page and:
   - Click "Create a new release"
   - Select the tag created in step 1
   - Add release notes describing the changes
   - Click "Publish release"

4. **Automatic NPM publication**: Once the GitHub release is published, the package will be automatically published to NPM via GitHub Actions workflow.

> **Note**: Make sure you have the `NPM_TOKEN` secret configured in your repository settings for the NPM publication to work.
