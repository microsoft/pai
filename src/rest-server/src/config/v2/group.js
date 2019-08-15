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
const Joi = require('joi');

// define the input schema for the 'update group extension' api
const groupExtensionUpdateInputSchema = Joi.object().keys({
  extension: Joi.object().pattern(/\w+/, Joi.required()),
}).required();

// define the input schema for the 'update group description' api
const groupDescriptionUpdateInputSchema = Joi.object().keys({
  description: Joi.string().empty(''),
});

// define the input schema for the 'update group external name' api
const groupExternalNameUpdateInputSchema = Joi.object().keys({
  externalName: Joi.string().empty(''),
});

// define the input schema for the 'update group extension attr' api
const groupExtensionAttrUpdateInputSchema = Joi.object().keys({
  data: Joi.any().required(),
});

// define the input schema for the 'create group' api
const groupCreateInputSchema = Joi.object().keys({
  groupname: Joi.string()
    .regex(/^[A-Za-z0-9_]+$/, 'groupname')
    .required(),
  description: Joi.string()
    .empty(''),
  externalName: Joi.string()
    .empty(''),
  extension: Joi.object()
    .pattern(/\w+/, Joi.required())
    .default(),
});

// module exports
module.exports = {
  groupExtensionUpdateInputSchema,
  groupDescriptionUpdateInputSchema,
  groupExternalNameUpdateInputSchema,
  groupCreateInputSchema,
  groupExtensionAttrUpdateInputSchema,
};
