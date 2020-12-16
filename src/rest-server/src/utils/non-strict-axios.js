const https = require('https');
const axios = require('axios');
const httpContext = require('express-http-context');
const tokenConfig = require('@pai/config/token');

// Bypass cert verification temporarily because our cert doesn't have correct Common Name/Subject Alternative Names
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({rejectUnauthorized: false}),
});

axiosInstance.interceptors.request.use((req)=> {
  const userToken = httpContext.get('token');
  const userName = httpContext.get('userName');
  const token = userToken || tokenConfig.adminMTToken;
  req.headers.Accept = 'application/json';
  req.headers.Authorization = `Bearer ${token}`;
  if (userName) {
    if (req.params) {
      req.params['user.name'] = userName;
    } else {
      req.params = {'user.name': userName};
    }
  }
  return req;
});

module.exports = axiosInstance;
