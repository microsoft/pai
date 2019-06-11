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

const logger = require('./logger');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const authnConfig = require('./authn');

const users = [];

module.exports = function(passport) {
  const findByOid = function(oid, fn) {
    let i = 0;
    let len = users.length;
    for (; i < len; i++) {
      const user = users[i];
      logger.info('we are using user: ', user);
      if (user.oid === oid) {
        return fn(null, user);
      }
    }
    return fn(null, null);
  };

  passport.serializeUser(function(user, done) {
    done(null, user.oid);
  });

  passport.deserializeUser(function(oid, done) {
    findByOid(oid, function(err, user) {
      done(err, user);
    });
  });
  passport.use(new OIDCStrategy({
        identityMetadata: authnConfig.OIDCConfig.identityMetadata,
        clientID: authnConfig.OIDCConfig.clientID,
        responseType: authnConfig.OIDCConfig.responseType,
        responseMode: authnConfig.OIDCConfig.responseMode,
        redirectUrl: authnConfig.OIDCConfig.redirectUrl,
        allowHttpForRedirectUrl: authnConfig.OIDCConfig.allowHttpForRedirectUrl,
        clientSecret: authnConfig.OIDCConfig.clientSecret,
        validateIssuer: authnConfig.OIDCConfig.validateIssuer,
        isB2C: authnConfig.OIDCConfig.isB2C,
        issuer: authnConfig.OIDCConfig.issuer,
        passReqToCallback: authnConfig.OIDCConfig.passReqToCallback,
        scope: authnConfig.OIDCConfig.scope,
        loggingLevel: authnConfig.OIDCConfig.loggingLevel,
        nonceLifetime: authnConfig.OIDCConfig.nonceLifetime,
        nonceMaxAmount: authnConfig.OIDCConfig.nonceMaxAmount,
        useCookieInsteadOfSession: authnConfig.OIDCConfig.useCookieInsteadOfSession,
        cookieEncryptionKeys: authnConfig.OIDCConfig.cookieEncryptionKeys,
        clockSkew: authnConfig.OIDCConfig.clockSkew,
      },
      function(iss, sub, profile, accessToken, refreshToken, done) {
        if (!profile.oid) {
          return done(new Error('No oid found'), null);
        }
        // asynchronous verification, for effect...
        process.nextTick(function() {
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
    )
  );
};


