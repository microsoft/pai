module.exports = {
  plugins: ['eslint-plugin-prettier'],
  env: {
    browser: false,
    es6: true,
    node: true,
    jquery: true,
  },
  extends: ['standard', 'plugin:prettier/recommended', 'prettier'],
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    cookies: 'readonly',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'prettier/prettier': ['error'],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
  },
};
