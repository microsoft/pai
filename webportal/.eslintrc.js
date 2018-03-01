module.exports = {
  "env": {
    "browser": true,
    "es6": true,
    "node": true,
    "jquery": true,
  },
  "extends": ["eslint:recommended", "google"],
  "globals": {
    "cookies": false,
    "userLogout": false,
  },
  "rules": {
    "linebreak-style": 0,
    "max-len": [0, 80],
    "new-cap": 0,
    "require-jsdoc": 0,
    'valid-jsdoc': 0,
  }
};