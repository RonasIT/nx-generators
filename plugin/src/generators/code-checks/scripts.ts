export default {
  'lint': 'npx tsc && cross-env ESLINT_USE_FLAT_CONFIG=false npx eslint ./',
  'format': 'npx prettier --write . && npm run lint -- --fix',
  'prepare': 'husky',
}
