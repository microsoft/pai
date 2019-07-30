module.exports = {
  plugins: ['eslint-plugin-prettier'],
  env: {
    browser: true,
    es6: true,
    node: true,
    jquery: true,
  },
  extends: ['airbnb', 'plugin:prettier/recommended', 'prettier/react', 'prettier'],
  globals: {
    cookies: 'readonly',
    userLogout: 'readonly',
  },
  rules: {
    'prettier/prettier': 'warn',
    // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'error',
    'react/display-name': 'off',
  },
}
