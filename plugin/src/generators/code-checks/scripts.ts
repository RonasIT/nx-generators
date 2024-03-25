export default {
  'lint': 'npx tsc && npx eslint ./',
  'format': 'npx prettier --write . && npm run lint -- --fix',
}
