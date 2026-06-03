module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind', reanimated: false }],
    ],
    plugins: [
      require('react-native-css-interop/dist/babel-plugin').default,
      [
        '@babel/plugin-transform-react-jsx',
        {
          runtime: 'automatic',
          importSource: 'react-native-css-interop',
        },
      ],
      // Must be LAST. Enables Reanimated worklets (used by
      // react-native-draggable-flatlist for the sortable Insights list). The
      // preset keeps reanimated:false so we control plugin ordering relative to
      // the css-interop transforms above. Build-time change → needs a rebuild.
      'react-native-reanimated/plugin',
    ],
  };
};
