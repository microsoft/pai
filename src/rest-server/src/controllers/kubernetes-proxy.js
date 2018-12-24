const assert = require('assert');
const {parse} = require('url');

const proxy = require('http-proxy-middleware');

const {apiserver: {uri, ca, token}} = require('../config/kubernetes');

const options = {
  target: parse(uri),
  changeOrigin: true,
  pathRewrite(path, req) {
    // Strip leading baseUrl
    assert(path.slice(0, req.baseUrl.length) === req.baseUrl);
    return path.slice(req.baseUrl.length);
  },
};
if (ca) {
  options.ca = ca;
}
if (token) {
  options.headers = {Authorization: `Bearer ${token}`};
} else {
  options.headers = {Authorization: null};
}

module.exports = proxy(options);
