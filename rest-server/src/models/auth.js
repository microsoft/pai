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

const adapter = new FileSync(config.lowdbFile);
const db = low(adapter);

const add = (username, password, callback) => {
  if (db.has(username).value()) {
    callback(null, false);
  } else {
    const salt = crypto.createHash('md5').update(username).digest('hex');
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, derivedKey) => {
      if (err) {
        callback(err, false);
      } else {
        db.set(username, { passwd: derivedKey.toString('hex') }).write();
        callback(null, true);
      }
    });
  }
}

const check = (username, password, callback) => {
  if (!db.has(username).value()) {
    callback(null, false);
  } else {
    const hash = db.get(`${username}.passwd`).value();
    const salt = crypto.createHash('md5').update(username).digest('hex');
    crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, derivedKey) => {
      callback(err, derivedKey.toString('hex') === hash);
    });
  }
}

// module exports
module.exports = { check, add };