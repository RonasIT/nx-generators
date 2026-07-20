module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'react-native-unistyles/plugin',
        {
          root: 'app',
          autoProcessImports: '@ronas-it/mobile',
        },
      ],
      ['react-native-worklets/plugin'],
    ],
    overrides: [
      {
        test: (filename) => !!filename && /libs[\\/].*[\\/]data-access[\\/]/.test(filename),
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-transform-class-properties', { loose: true }],
        ],
      },
    ],
  };
};
