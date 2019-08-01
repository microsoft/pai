module.exports = {
  plugins: ['eslint-plugin-prettier'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jquery: true,
  },
  extends: [
    'standard',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/react',
    'prettier',
  ],
  parserOptions: {
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    cookies: 'readonly',
    userLogout: 'readonly',
  },
  rules: {
    'prettier/prettier': ['error'],
    'react/display-name': 'off',
    // 'max-len': [
    //   'error',
    //   {
    //     code: 120,
    //   },
    // ],
  },
};
