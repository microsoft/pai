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
const Ajv = require('ajv');
const ajv = new Ajv({allErrors: true, useDefaults: true});

// hived schema
const hivedSchema = {
  type: 'object',
  properties: {
    extras: {
      type: 'object',
      properties: {
        hivedScheduler: {
          type: 'object',
          properties: {
            jobPriorityClass: {
              enum: ['prod', 'test', 'oppo'],
            },
            taskRoles: {
              patternProperties: {
                '^[A-Za-z0-9._~]+$': {
                  type: 'object',
                  properties: {
                    gpuType: {
                      type: ['string', 'null'],
                      default: null,
                    },
                    reservationId: {
                      type: ['string', 'null'],
                      default: null,
                    },
                    affinityGroupName: {
                      type: ['string', 'null'],
                      default: null,
                    },
                  },
                  additionalProperties: false,
                },
              },
              minProperties: 1,
              additionalProperties: false,
            },
          },
        },
      },
      additionalProperties: true,
    },
  },
  additionalProperties: true,
};

const hivedValidate = ajv.compile(hivedSchema);


// module exports
module.exports = {
  validate: hivedValidate,
};
