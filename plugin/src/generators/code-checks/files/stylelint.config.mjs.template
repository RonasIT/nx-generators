/** @type {import('stylelint').Config} */
export default {
  extends: ['stylelint-config-standard-scss'],
  ignoreFiles: ['**/node_modules', '**/.yalc', 'dist', 'output'],
  rules: {
    'selector-class-pattern': [
      '^([a-z][a-z0-9]*)(_[a-z0-9]+)*$',
      {
        message: (selector) => `Expected class selector "${selector}" to be snake-case`,
      },
    ],
    'custom-property-empty-line-before': [
      'always',
      {
        except: ['first-nested'],
        ignore: ['after-custom-property', 'after-comment', 'inside-single-line-block'],
      },
    ],
  },
};
