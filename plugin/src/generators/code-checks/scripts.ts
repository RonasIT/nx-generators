export default {
  lint: 'npx tsc && npx eslint ./',
  'lint:css': 'npx stylelint "**/*.{css,scss}" --fix --allow-empty-input',
  format: 'npx prettier --write . && npm run lint -- --fix && npm run lint:css',
  prepare: 'husky',
};
