module.exports = {
  plugins: ["react"],
  env: {
    browser: true,
    es6: true,
    node: true,
    jquery: true
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "google",
    "prettier/react",
    "prettier"
  ],
  globals: {
    cookies: "readonly",
    userLogout: "readonly"
  },
  rules: {
    "prettier/prettier": "warn",
    "max-len": ["error", 80],
    // https://basarat.gitbooks.io/typescript/docs/tips/defaultIsBad.html
    "import/prefer-default-export": "off",
    "import/no-default-export": "error",
    "react/display-name": "off"
  },
  settings: {
    react: {
      version: "detect" // https://github.com/yannickcr/eslint-plugin-react/issues/1955
    }
  },
  overrides: [
    {
      files: [
        "**/*.jsx",
        "src/app/job/job-view/fabric/**/*.js",
        "src/app/components/**/*.js",
        "src/app/home/**/*.js",
        "src/app/user/fabric/**/*.js",
        "src/app/job-submission/**/*.js"
      ],
      parser: "babel-eslint"
    }
  ]
};
