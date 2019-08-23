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

/**
 * @function assignValueByKeyarray - assign a value by a key array in a nested obj.
 * @async
 * @param {Object} obj - origin nested object.
 * @param {Array} keyarray - a group of keys indexing the updated attribute, [key_a, key_b, key_c] means the updated
 *                attribute is obj[key_a][key_b][key_c], will create attribute if not exist.
 * @param {Any} value - new value assigned to the attribute
 * @return {Object} Updated nested object
 */

const assignValueByKeyarray = (obj, keyarray, value) => {
  if (keyarray.length === 0) {
    return value;
  }
  const originObj = obj;
  const lastKeyIndex = keyarray.length - 1;
  for (const key of keyarray.slice(0, lastKeyIndex)) {
    if (!(key in obj)) {
      obj[key] = {};
    }
    obj = obj[key];
  }
  obj[keyarray[lastKeyIndex]] = value;
  return originObj;
};

// module exports
module.exports = {
  assignValueByKeyarray,
};
