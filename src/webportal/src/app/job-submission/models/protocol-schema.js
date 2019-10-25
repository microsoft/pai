/*
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import Joi from 'joi-browser';

export const taskRoleSchema = Joi.object().keys({
  instances: Joi.number()
    .default(1)
    .min(1),
  completion: Joi.object().keys({
    minFailedInstances: Joi.number()
      .min(-1)
      .allow(null)
      .default(1),
    minSucceededInstances: Joi.number()
      .min(-1)
      .allow(null)
      .default(-1),
  }),
  taskRetryCount: Joi.number().default(0),
  // Following dockerImage, data, output and script should ref to prerequisites content
  dockerImage: Joi.string().required(),
  data: Joi.string(),
  output: Joi.string(),
  script: Joi.string(),
  extraContainerOptions: Joi.object().keys({
    shmMB: Joi.number(),
  }),
  resourcePerInstance: Joi.object()
    .required()
    .keys({
      cpu: Joi.number().required(),
      memoryMB: Joi.number().required(),
      gpu: Joi.number().required(),
      ports: Joi.object().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/, Joi.number()),
    }),
  commands: Joi.array()
    .items(Joi.string())
    .min(1)
    .required(),
});

export const taskRolesSchema = Joi.object().pattern(
  /^[a-zA-Z_][a-zA-Z0-9_]*$/,
  taskRoleSchema.required(),
);

export const prerequisitesSchema = Joi.object().keys({
  protocolVersion: [Joi.string(), Joi.number()],
  name: Joi.string()
    .required()
    .regex(/^[a-zA-Z0-9_-]+$/),
  type: Joi.string()
    .valid(['data', 'script', 'dockerimage', 'output'])
    .required(),
  contributor: Joi.string(),
  description: Joi.string(),
  auth: Joi.object().keys({
    username: Joi.string(),
    password: Joi.string(),
    registryuri: Joi.string(),
  }),
  uri: Joi.when('type', {
    is: 'data',
    then: Joi.array()
      .items(Joi.string())
      .required(),
    otherwise: Joi.string(),
  }).required(),
  version: [Joi.string(), Joi.number()],
});

const deploymentSchema = Joi.object().keys({
  name: Joi.string()
    .regex(/^[A-Za-z0-9._~]+$/)
    .required(),
  taskRoles: Joi.object()
    .pattern(
      /^[A-Za-z0-9._~]+$/,
      Joi.object().keys({
        preCommands: Joi.array()
          .items(Joi.string())
          .min(1),
        postCommands: Joi.array()
          .items(Joi.string())
          .min(1),
      }),
    )
    .required(),
});

const tensorBoardExtrasSchema = Joi.object().keys({
  randomStr: Joi.string()
    .regex(/^[a-z0-9]{8}$/)
    .required(),
  logDirectories: Joi.object()
    .min(1)
    .required(),
});

export const jobProtocolSchema = Joi.object().keys({
  protocolVersion: [Joi.string().required(), Joi.number().required()],
  name: Joi.string().required(),
  type: Joi.string().required(),
  version: [Joi.string(), Joi.number()],
  contributor: Joi.string(),
  description: Joi.string(),

  prerequisites: Joi.array()
    .items(prerequisitesSchema)
    .min(1),

  parameters: Joi.object(),
  secrets: Joi.object(),

  jobRetryCount: Joi.number().default(0),
  taskRoles: taskRolesSchema,
  deployments: Joi.array()
    .items(deploymentSchema)
    .min(1),
  defaults: Joi.object().keys({
    virtualCluster: Joi.string(),
    deployment: Joi.string(),
  }),
  extras: Joi.object()
    .keys({
      submitFrom: Joi.string(),
      tensorBoard: tensorBoardExtrasSchema,
    })
    .unknown(),
});
