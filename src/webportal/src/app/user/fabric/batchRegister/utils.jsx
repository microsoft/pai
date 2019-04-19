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

const Joi = require('joi-browser');

export const toBool = (val) => {
  return (String(val)).toLowerCase() === 'true' || (String(val)).toLowerCase() === 'yes';
};

export const isFinished = (userInfo) => {
  const {status: {isSuccess} = {}} = userInfo;
  if (isSuccess) return true;
  return false;
};

const usernameSchema = Joi.string().token().required();
export const checkUsername = (value) => {
  const {error} = Joi.validate(value, usernameSchema);
  if (error) {
    return error.message.replace('"value"', 'User name');
  } else {
    return error;
  }
};

const passwordSchema = Joi.string().min(6).required();
export const checkPassword = (value) => {
  const {error} = Joi.validate(value, passwordSchema);
  if (error) {
    return error.message.replace('"value"', 'Password');
  } else {
    return error;
  }
};
