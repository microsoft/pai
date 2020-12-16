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
'use strict';

const jwt = require('jsonwebtoken');
const {tokenPublicKey: publicKey, tokenPrivateKey: privateKey} = require('@pai/config/ssl');

const issuer = process.env.MT_TOKEN_ISSUER ?
  process.env.MT_TOKEN_ISSUER : 'restserver.magnetar';
const audience = process.env.MT_TOKEN_AUDIENCE ?
  process.env.MT_TOKEN_AUDIENCE : 'magnetar';
const defaultExpiryDurationSecs = process.env.MT_TOKEN_DEFAULT_EXPIRY_DURATION_SECS ?
  Number(process.env.MT_TOKEN_DEFAULT_EXPIRY_DURATION_SECS) : 604800; // 7 days
const maxExpiryDurationSecs = process.env.MT_TOKEN_MAX_EXPIRY_DURATION_SECS ?
  Number(process.env.MT_TOKEN_MAX_EXPIRY_DURATION_SECS) : 31536000; // 1 year

/**
 * The Payload of MT Token:
 * [CLAIM]{TYPE} FILED NAME EXPOSED BY APIS
 *
 * [sub]{string} payload.userName:
 *    The MT UserName.
 *
 * [admin]{bool} payload.admin:
 *    Whether the user is MT Admin.
 *    MT Admin has a lot of privileges, such as impersonate to be other users.
 *
 * [iat]{number} payload.issueEpoch:
 *    The epoch time at which the MT Token was issued.
 *
 * [exp]{number} payload.expiryEpoch:
 *    The epoch time at or after which the MT Token expired.
 *
 * [iss]{string} payload.issuer:
 *    Who issued the token.
 *
 * [aud]{string} payload.audience:
 *    Intended recipient of the token.
 *
 * [otype]{string} payload.originType:
 *    The type of trust source based on which the MT Token is signed.
 *    For example, it can be:
 *      AAD: The MT Token is signed based on the trust of AAD.
 *      MT: The MT Token is signed based on the trust of another MT Token.
 *
 * [osub]{string} payload.originUserName:
 *    Get the MT UserName of trust source based on which the MT Token is signed.
 *    If the MT Token is signed by the user itself, it is the same as the
 *    userName, otherwise it is the MT UserName who signed the MT Token by
 *    impersonation.
 */

/**
 * @param {string} userName - payload.userName.
 * @param {boolean} admin - payload.admin.
 * @param {number} expiryDurationSecs - payload.expiryEpoch - payload.issueEpoch
 * @param {string} originType - payload.originType
 * @param {string} originUserName - payload.originUserName
 * @returns {string} - The MT Token created from above payload.
 * @throws {Error} - If failed to create, or above payload is invalid.
 */
const create = (
  userName,
  admin,
  expiryDurationSecs,
  originType,
  originUserName) => {
  // Defaulting
  admin = Boolean(admin);
  if (typeof expiryDurationSecs === 'undefined') {
    expiryDurationSecs = defaultExpiryDurationSecs;
  }
  expiryDurationSecs = Number(expiryDurationSecs);

  // Validation
  if (!userName) {
    throw new Error('UserName is required');
  }
  if (!(expiryDurationSecs > 0 && expiryDurationSecs <= maxExpiryDurationSecs)) {
    throw new Error('ExpiryDurationSecs ' + expiryDurationSecs + ' should be within ' +
      '(0, ' + maxExpiryDurationSecs + ']');
  }

  // Sign
  // TODO: Store the generated Token on HDFS
  return jwt.sign({
    sub: userName,
    admin: admin,
    iss: issuer,
    aud: audience,
    otype: originType,
    osub: originUserName,
  }, privateKey, {
    algorithm: 'RS256',
    expiresIn: expiryDurationSecs,
  });
};

/**
 * @param {string} token - The MT Token
 * @returns {object} - The Payload decoded if the token is valid.
 * @throws {Error} - If failed to verify, or the token is invalid.
 */
const verify = (token) => {
  const rawPayload = jwt.verify(token, publicKey);
  const payload = {
    userName: rawPayload.sub,
    admin: Boolean(rawPayload.admin),
    issueEpoch: Number(rawPayload.iat),
    expiryEpoch: Number(rawPayload.exp),
    issuer: rawPayload.iss,
    audience: rawPayload.aud,
    originType: rawPayload.otype,
    originUserName: rawPayload.osub,
  };

  if (!payload.userName) {
    throw new Error('UserName is required');
  }
  if (!payload.expiryEpoch) {
    throw new Error('ExpiryEpoch is required');
  }
  if (payload.issuer !== issuer) {
    throw new Error(`Issuer should be [${issuer}], but got [${payload.issuer}]`);
  }
  if (payload.audience !== audience) {
    throw new Error(`Audience should be [${audience}], but got [${payload.audience}]`);
  }

  return payload;
};

module.exports = {
  create,
  verify,
};
