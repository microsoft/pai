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

const Joi = require('joi');
const crypto = require('crypto');

const userSchema = Joi.object.keys({
  username: Joi.string()
    .token()
    .required(),
  email: Joi.string()
    .email()
    .empty(''),
  grouplist: Joi.array()
    .items(Joi.string())
    .empty([]),
  password: Joi.string()
    .empty(''),
  extension: Joi.object().pattern(/\w+/, Joi.required()),
}).required();

class User {
  constructor(value) {
    const {error, validValue} = Joi.validata(value, userSchema);
    if (error) {
      throw new Error('User schema error\n${error}');
    }
    this.data = validValue;
  }

  async encryptPassword() {
    this.data['password'] = await this.encrypt(this.data['username'], this.data['password']);
  }

  encrypt(username, password) {
    const iterations = 10000;
    const keylen = 64;
    const salt = crypto.createHash('md5').update(username).digest('hex');
    return new Promise( (res, rej) => {
      crypto.pbkdf2(password, salt, iterations, keylen, 'sha512', (err, key) => {
        err ? rej(err) : res(key);
      });
    });
  }
}

async function encryptUserPassword(userInstance) {
  await userInstance.encryptPassword();
}

function createUser(value) {
  let userInstance = new User(value);
  return userInstance;
}

module.exports = {encryptUserPassword, createUser};
