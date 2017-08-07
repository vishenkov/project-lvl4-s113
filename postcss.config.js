export default () => ({
  parser: 'sugarss',
  plugins: {
    'postcss-import': {},
    'postcss-cssnext': {},
    autoprefixer: {},
    cssnano: {},
  },
});
