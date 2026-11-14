export default {
  'lint-staged': {
    '*.{ts,tsx}': 'tsc-files --noEmit types.d.ts',
    '*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}': ['oxlint --fix', 'oxfmt --write'],
    '*.{json,jsonc,md,mdx,html,yml,yaml}': 'oxfmt --write',
    '*.{css,scss}': ['oxfmt --write', 'stylelint --fix --allow-empty-input'],
  },
};
