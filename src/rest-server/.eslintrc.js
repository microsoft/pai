module.exports = {
  "parserOptions": {
    "ecmaVersion": 2017,
    "ecmaFeatures": {
      "experimentalObjectRestSpread": true
    }
  },
  "env": {
    "es6": true,
    "node": true,
  },
  "extends": ["eslint:recommended", "google"],
  "rules": {
    "max-len": [0, 80],
    "require-jsdoc": 0,
    "valid-jsdoc": 0,
    "linebreak-style": 0,
  },
};
