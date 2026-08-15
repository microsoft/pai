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

const sensitiveFieldPattern = /(^password$|token|secret|private|credential|connectionstring|sas)$/i;
const privateKeyPattern = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;

const clone = (value) => JSON.parse(JSON.stringify(value));

const isSensitiveField = (fieldName) => {
  return sensitiveFieldPattern.test(fieldName) || fieldName === 'key';
};

const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue).filter((item) => item !== undefined);
  }
  if (value && typeof value === 'object') {
    const sanitized = {};
    for (const [key, childValue] of Object.entries(value)) {
      if (isSensitiveField(key)) {
        continue;
      }
      const sanitizedChild = sanitizeValue(childValue);
      if (sanitizedChild !== undefined) {
        sanitized[key] = sanitizedChild;
      }
    }
    return sanitized;
  }
  if (typeof value === 'string' && privateKeyPattern.test(value)) {
    return undefined;
  }
  return value;
};

const sanitizeUser = (userInfo) => {
  const sanitized = clone(userInfo);
  delete sanitized.password;
  if (sanitized.extension) {
    sanitized.extension = sanitizeValue(sanitized.extension);
  }
  return sanitized;
};

const sanitizeUserList = (userList) => userList.map(sanitizeUser);

module.exports = {
  sanitizeUser,
  sanitizeUserList,
};
