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
const ajvMerge = require('ajv-merge-patch/keywords/merge');

const ajv = new Ajv({allErrors: true});
ajvMerge(ajv);

// base schema
const baseSchema = {
  $id: 'base.json',
  type: 'object',
  properties: {
    protocolVersion: {
      enum: ['2', 2],
    },
    name: {
      type: 'string',
      pattern: '^[a-zA-Z0-9_-]+$',
    },
    version: {
      type: ['string', 'number'],
    },
    contributor: {
      type: 'string',
    },
    description: {
      type: 'string',
    },
  },
};

// job protocol schema
const protocolSchema = {
  $id: 'protocol.json',
  type: 'object',
  properties: {
    protocolVersion: {
      $ref: 'base.json#/properties/protocolVersion',
    },
    name: {
      $ref: 'base.json#/properties/name',
    },
    type: {
      type: 'string',
      enum: ['job'],
    },
    version: {
      $ref: 'base.json#/properties/version',
    },
    contributor: {
      $ref: 'base.json#/properties/contributor',
    },
    description: {
      $ref: 'base.json#/properties/description',
    },
    prerequisites: {
      type: 'array',
      items: {
        type: 'object',
        oneOf: [
          {
            // script or output prerequisite
            $merge: {
              source: {
                $ref: 'base.json#',
              },
              with: {
                properties: {
                  type: {
                    type: 'string',
                    enum: ['script', 'output'],
                  },
                  uri: {
                    type: 'string',
                  },
                },
                required: ['name', 'type', 'uri'],
                additionalProperties: false,
              },
            },
          },
          {
            // data prerequisite
            $merge: {
              source: {
                $ref: 'base.json#',
              },
              with: {
                properties: {
                  type: {
                    type: 'string',
                    enum: ['data'],
                  },
                  uri: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
                required: ['name', 'type', 'uri'],
                additionalProperties: false,
              },
            },
          },
          {
            // docker image prerequisite
            $merge: {
              source: {
                $ref: 'base.json#',
              },
              with: {
                properties: {
                  type: {
                    type: 'string',
                    enum: ['dockerimage'],
                  },
                  auth: {
                    type: 'object',
                    properties: {
                      username: {
                        type: 'string',
                      },
                      password: {
                        type: 'string',
                      },
                      registryuri: {
                        type: 'string',
                      },
                    },
                  },
                  uri: {
                    type: 'string',
                  },
                },
                required: ['name', 'type', 'uri'],
                additionalProperties: false,
              },
            },
          },
        ],
      },
      minItems: 1,
    },
    parameters: {
      type: 'object',
      additionalProperties: true,
    },
    secrets: {
      type: 'object',
      additionalProperties: true,
    },
    jobRetryCount: {
      type: 'integer',
      minimum: 0,
    },
    taskRoles: {
      patternProperties: {
        '^[a-zA-Z_][a-zA-Z0-9_]*$': {
          type: 'object',
          properties: {
            protocolVersion: {
              $ref: 'base.json#/properties/protocolVersion',
            },
            instances: {
              type: 'integer',
              minimum: 1,
            },
            completion: {
              type: 'object',
              properties: {
                minFailedInstances: {
                  type: ['integer', 'null'],
                },
                minSucceededInstances: {
                  type: ['integer', 'null'],
                },
              },
              additionalProperties: false,
            },
            taskRetryCount: {
              type: 'integer',
            },
            dockerImage: {
              type: 'string',
            },
            data: {
              type: 'string',
            },
            output: {
              type: 'string',
            },
            script: {
              type: 'string',
            },
            extraContainerOptions: {
              type: 'object',
              properties: {
                shmMB: {
                  type: 'integer',
                },
                additionalProperties: false,
              },
            },
            resourcePerInstance: {
              type: 'object',
              properties: {
                cpu: {
                  type: 'integer',
                },
                memoryMB: {
                  type: 'integer',
                },
                gpu: {
                  type: 'integer',
                },
                ports: {
                  patternProperties: {
                    '^[a-zA-Z_][a-zA-Z0-9_]*$': {
                      type: 'integer',
                    },
                  },
                  minProperties: 1,
                  additionalProperties: false,
                },
              },
              required: [
                'cpu',
                'memoryMB',
                'gpu',
              ],
              additionalProperties: false,
            },
            commands: {
              type: 'array',
              items: {
                type: 'string',
              },
              minItems: 1,
            },
          },
          required: [
            'dockerImage',
            'resourcePerInstance',
            'commands',
          ],
          additionalProperties: false,
        },
      },
      minProperties: 1,
      additionalProperties: false,
    },
    deployments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          protocolVersion: {
            $ref: 'base.json#/properties/protocolVersion',
          },
          name: {
            $ref: 'base.json#/properties/name',
          },
          taskRoles: {
            patternProperties: {
              '^[a-zA-Z_][a-zA-Z0-9_]*$': {
                type: 'object',
                properties: {
                  preCommands: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    minItems: 1,
                  },
                  postCommands: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    minItems: 1,
                  },
                },
                additionalProperties: false,
              },
            },
            minProperties: 1,
            additionalProperties: false,
          },
        },
        required: [
          'name',
          'taskRoles',
        ],
      },
      minItems: 1,
    },
    defaults: {
      type: 'object',
      properties: {
        deployment: {
          type: 'string',
        },
      },
    },
    extras: {
      type: 'object',
    },
  },
  required: [
    'protocolVersion',
    'name',
    'type',
    'taskRoles',
  ],
  additionalProperties: false,
};

const protocolValidate = ajv.addSchema(baseSchema).compile(protocolSchema);


// module exports
module.exports = {
  validate: protocolValidate,
};
