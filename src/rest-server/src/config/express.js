// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


// module dependencies
const cors = require('cors');
const morgan = require('morgan');
const express = require('express');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const config = require('./index');
const logger = require('./logger');
const azureConfig = require('./azure');
const router = require('../routes/index');
const routerV2 = require('../routes/indexV2');
const createError = require('../util/error');

const passport = require('passport');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;



passport.serializeUser(function(user, done) {
  done(null, user.oid);
});

passport.deserializeUser(function(oid, done) {
  findByOid(oid, function (err, user) {
    done(err, user);
  });
});


var users = [];

var findByOid = function(oid, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    log.info('we are using user: ', user);
    if (user.oid === oid) {
      return fn(null, user);
    }
  }
  return fn(null, null);
};

passport.use(new OIDCStrategy({
      identityMetadata: azureConfig.azAAD.identityMetadata,
      clientID: azureConfig.azAAD.clientID,
      responseType: azureConfig.azAAD.responseType,
      responseMode: azureConfig.azAAD.responseMode,
      redirectUrl: azureConfig.azAAD.redirectUrl,
      allowHttpForRedirectUrl: azureConfig.azAAD.allowHttpForRedirectUrl,
      clientSecret: azureConfig.azAAD.clientSecret,
      validateIssuer: azureConfig.azAAD.validateIssuer,
      isB2C: azureConfig.azAAD.isB2C,
      issuer: azureConfig.azAAD.issuer,
      passReqToCallback: azureConfig.azAAD.passReqToCallback,
      scope: azureConfig.azAAD.scope,
      loggingLevel: azureConfig.azAAD.loggingLevel,
      nonceLifetime: azureConfig.azAAD.nonceLifetime,
      nonceMaxAmount: azureConfig.azAAD.nonceMaxAmount,
      useCookieInsteadOfSession: azureConfig.azAAD.useCookieInsteadOfSession,
      cookieEncryptionKeys: azureConfig.azAAD.cookieEncryptionKeys,
      clockSkew: azureConfig.azAAD.clockSkew,
    },
    function(iss, sub, profile, accessToken, refreshToken, done) {
      if (!profile.oid) {
        return done(new Error("No oid found"), null);
      }
      // asynchronous verification, for effect...
      process.nextTick(function () {
        findByOid(profile.oid, function(err, user) {
          if (err) {
            return done(err);
          }
          if (!user) {
            // "Auto-registration"
            users.push(profile);
            return done(null, profile);
          }
          return done(null, user);
        });
      });
    }
));



const app = express();

app.set('json spaces', config.env === 'development' ? 4 : 0);

app.use(cors());
app.use(compress());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: false }));
//app.use(bodyParser.urlencoded({ extended : true }));
app.use(passport.initialize());
app.use(passport.session());

// setup the logger for requests
app.use(morgan('dev', {'stream': logger.stream}));

// mount all v1 APIs to /api/v1
app.use('/api/v1', router);

// mount all v2 APIs to /api/v2
app.use('/api/v2', routerV2);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError('Not Found', 'NoApiError', `API ${req.url} is not found.`));
});

// error handler
app.use((err, req, res, next) => {
  logger.warn(err.stack);
  res.status(err.status || 500).json({
    code: err.code,
    message: err.message,
    stack: config.env === 'development' ? err.stack.split('\n') : void 0,
  });
});

// module exports
module.exports = app;
