export default {
  'deps:sync': 'npx syncpack fix-mismatches',
  'g:library': 'npx nx g @nx/expo:lib --skipPackageJson --unitTestRunner=none',
  'g:component':
    'npx nx g @nx/expo:component component --export --flat --skipTests --directory=lib/${npm_config_name}',
  'g:subcomponent':
    'npx nx g @nx/expo:component component --export=false --flat --skipTests --directory=lib/components/${npm_config_name}',
};
