export default {
  'lint': 'npx tsc && ESLINT_USE_FLAT_CONFIG=false npx eslint ./',
  'format': 'npx prettier --write . && npm run lint -- --fix',
  'prepare': 'husky',
}
