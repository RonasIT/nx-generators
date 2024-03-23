export default {
  'lint': 'eslint ./',
  'format': 'npx prettier --write . && npm run lint -- --fix',
  'verify': 'npx tsc',
}
