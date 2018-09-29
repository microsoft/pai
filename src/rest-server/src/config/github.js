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

const fse = require('fs-extra');
const Joi = require('joi');
const dotenv = require('dotenv');

require.extensions['.mustache'] = (module, filename) => {
  module.exports = fse.readFileSync(filename, 'utf8');
};

dotenv.config();

let dataSource = {
  owner: process.env.GITHUB_OWNER,
  repository: process.env.GITHUB_REPOSITORY,
  branch: 'master', // Due to limitation at https://developer.github.com/v3/search/#search-code, the branch must be 'master'.
  path: process.env.GITHUB_PATH,
};

// define dataSource schema
const dataSourceSchema = Joi.object().keys({
  owner: Joi.string().empty('')
    .default('Microsoft'),
  repository: Joi.string().empty('')
    .default('pai'),
  branch: Joi.string().empty('')
    .default('master')
    .allow(['master']),
  path: Joi.string().empty('')
    .default('marketplace'),
}).required();

const {error, value} = Joi.validate(dataSource, dataSourceSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}
dataSource = value;

module.exports = dataSource;
