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
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const crypto = require('crypto');
const config = require('../config/index');
const logger = require('../config/logger');


const iterations = 10000;
const keylen = 64;

const defaultValue = {}
defaultValue[config.lowdbAdmin] = {
  passwd: crypto.pbkdf2Sync(
      config.lowdbPasswd,
      crypto.createHash('md5').update(config.lowdbAdmin).digest('hex'),
      iterations,
      keylen,
      'sha512').toString('hex'),
  admin: true
};
const adapter = new FileSync(config.lowdbFile, { defaultValue: defaultValue });
const db = low(adapter);

const update = (username, password, modify, callback) => {
  if (typeof modify === 'undefined' || db.has(username).value() !== modify) {
    callback(null, false);
  } else {
    const salt = crypto.createHash('md5').update(username).digest('hex');
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, derivedKey) => {
      if (err) {
        callback(err, false);
      } else {
        db.set(username, { passwd: derivedKey.toString('hex'), admin: false }).write();
        callback(null, true);
      }
    });
  }
}

const check = (username, password, callback) => {
  if (!db.has(username).value()) {
    callback(null, false, false);
  } else {
    const user = db.get(username).value();
    const salt = crypto.createHash('md5').update(username).digest('hex');
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, derivedKey) => {
      callback(err, derivedKey.toString('hex') === user.passwd, user.admin);
    });
  }
}

// module exports
module.exports = { update, check };