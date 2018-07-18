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

/*
   Redis data schema:
   - marketplace:job.used = sortedlist ($count, $name)
   - marketplace:script.used = sortedlist ($count, $name)
   - marketplace:data.used = sortedlist ($count, $name)
   - marketplace:docker.used = sortedlist ($count, $name)
   - marketplace:head.index = hash ($name -> $latestVersion)
   - marketplace:template:${name} = hash ($version -> $content)
 */
let redisConfig = {
  connectionUrl: process.env.REDIS_URI,
  keyPrefix: 'marketplace:',
  getUsedKey: function(type) {
    return type + '.used';
  },
  headIndexKey: 'head.index',
  templateKeyPrefix: 'template:',
  getTemplateKey: function(name) {
    return this.templateKeyPrefix + name;
  },
};

const redisConfigSchema = Joi.object().keys({
  connectionUrl: Joi.string()
    .required(),
  keyPrefix: Joi.string()
    .required(),
  getUsedKey: Joi.func()
    .arity(1)
    .required(),
  headIndexKey: Joi.string()
    .required(),
  templateKeyPrefix: Joi.string()
    .required(),
  getTemplateKey: Joi.func()
    .arity(1)
    .required(),
});

const {error, value} = Joi.validate(redisConfig, redisConfigSchema);
if (error) {
  throw new Error(`config error\n${error}`);
}

module.exports = value;
