module.exports = {
  plugins: ['eslint-plugin-prettier'],
  env: {
    es6: true,
    node: true,
    mocha: true,
    browser: false,
  },
  extends: ['standard', 'plugin:prettier/recommended', 'prettier'],
  parserOptions: {
    ecmaFeatures: {
      ecmaVersion: 8,
      experimentalObjectRestSpread: true,
    },
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': ['error'],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreStrings: false,
        ignoreTemplateLiterals: true,
      },
    ],
  },
};
