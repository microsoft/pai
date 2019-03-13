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
const Joi = require('joi');

let azureData = {
  azRDMA: process.env.AZ_RDMA,
  azAAD: {
      // Required
      identityMetadata: 'https://login.microsoftonline.com/'+process.env.AZ_AAD_TENANT_NAME+'.onmicrosoft.com/.well-known/openid-configuration',
      // or equivalently: 'https://login.microsoftonline.com/<tenant_guid>/.well-known/openid-configuration'
      //
      // or you can use the common endpoint
      // 'https://login.microsoftonline.com/common/.well-known/openid-configuration'
      // To use the common endpoint, you have to either set `validateIssuer` to false, or provide the `issuer` value.

      // Required, the client ID of your app in AAD
      clientID: process.env.AZ_AAD_CLIENT_ID,

      // Required, must be 'code', 'code id_token', 'id_token code' or 'id_token'
      responseType: 'code id_token',

      // Required
      responseMode: 'form_post',

      // Required, the reply URL registered in AAD for your app
      redirectUrl: process.env.AZ_AAD_REDIRECT_URL,

      // Required if we use http for redirectUrl
      allowHttpForRedirectUrl: true,

      // Required if `responseType` is 'code', 'id_token code' or 'code id_token'.
      // If app key contains '\', replace it with '\\'.
      clientSecret: process.env.AZ_AAD_CLIENT_SECRET,

      // Required to set to false if you don't want to validate issuer
      validateIssuer: true,

      // Required to set to true if you are using B2C endpoint
      // This sample is for v1 endpoint only, so we set it to false
      isB2C: false,

      // Required if you want to provide the issuer(s) you want to validate instead of using the issuer from metadata
      issuer: null,

      // Required to set to true if the `verify` function has 'req' as the first parameter
      passReqToCallback: false,

      // Recommended to set to true. By default we save state in express session, if this option is set to true, then
      // we encrypt state and save it in cookie instead. This option together with { session: false } allows your app
      // to be completely express session free.
      useCookieInsteadOfSession: true,

      // Required if `useCookieInsteadOfSession` is set to true. You can provide multiple set of key/iv pairs for key
      // rollover purpose. We always use the first set of key/iv pair to encrypt cookie, but we will try every set of
      // key/iv pair to decrypt cookie. Key can be any string of length 32, and iv can be any string of length 12.
      cookieEncryptionKeys: [
          { 'key': '12345678901234567890123456789012', 'iv': '123456789012' },
          { 'key': 'abcdefghijklmnopqrstuvwxyzabcdef', 'iv': 'abcdefghijkl' }
      ],

      // Optional. The additional scope you want besides 'openid', for example: ['email', 'profile'].
      scope: null,

      // Optional, 'error', 'warn' or 'info'
      loggingLevel: 'info',

      // Optional. The lifetime of nonce in session or cookie, the default value is 3600 (seconds).
      nonceLifetime: null,

      // Optional. The max amount of nonce saved in session or cookie, the default value is 10.
      nonceMaxAmount: 5,

      // Optional. The clock skew allowed in token validation, the default value is 300 seconds.
      clockSkew: null,


      // Optional.
      // If you want to get access_token for a specific resource, you can provide the resource here; otherwise,
      // set the value to null.
      // Note that in order to get access_token, the responseType must be 'code', 'code id_token' or 'id_token code'.
      resourceURL: 'https://graph.windows.net',

      // The url you need to go to destroy the session with AAD
      destroySessionUrl: 'https://login.microsoftonline.com/common/oauth2/logout?post_logout_redirect_uri=' + process.env.AZ_AAD_HOME_URL,

      // If you want to use the mongoDB session store for session middleware, set to true; otherwise we will use the default
      // session store provided by express-session.
      // Note that the default session store is designed for development purpose only.
      useMongoDBSessionStore: false,

      // If you want to use mongoDB, provide the uri here for the database.
      databaseUri: 'mongodb://localhost/OIDCStrategy',

      // How long you want to keep session in mongoDB.
      mongoDBSessionMaxAge: 24 * 60 * 60,  // 1 day (unit is second)
  }
};

// define the schema for azure
const azureSchema = Joi.object().keys({
    azRDMA: Joi.string().empty('')
    .valid('false', 'true'),
    azAAD: Joi.object()
        .pattern(
            /\w+/,
            Joi.required()
        ),
}).required();


const {error, value} = Joi.validate(azureData, azureSchema);
if (error) {
    throw new Error(`config error\n${error}`);
}
azureData = value;

module.exports = azureData;
