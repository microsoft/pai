import Joi from 'joi-browser';

const taskRoleSchema = Joi.object().keys({
  instances: Joi.number().default(1).min(1),
  completion: Joi.object().keys({
    minFailedInstances: Joi.number().min(1).allow(null).default(1),
    minSucceededInstances: Joi.number().min(1).allow(null).default(null),
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
  resourcePerInstance: Joi.object().required().keys({
    cpu: Joi.number().required(),
    memoryMB: Joi.number().required(),
    gpu: Joi.number().required(),
    ports: Joi.object().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/, Joi.number()),
  }),
  commands: Joi.array().items(Joi.string()).min(1).required(),
});

const prerequisitesSchema = Joi.object().keys({
  protocolVersion: Joi.string(),
  name: Joi.string().required().regex(/^[a-zA-Z0-9_-]+$/),
  type: Joi.string().required(),
  contributor: Joi.string(),
  description: Joi.string(),
  auth: Joi.object().keys({
    username: Joi.string(),
    password: Joi.string(),
    registryuri: Joi.string(),
  }),
  uri: [Joi.string(), Joi.array()],
});

const deploymentSchema = Joi.object().keys({
  name: Joi.string().regex(/^[A-Za-z0-9._~]+$/).required(),
  taskRoles: Joi.object().pattern(/^[A-Za-z0-9._~]+$/, Joi.object().keys({
    preCommands: Joi.array().items(Joi.string()).min(1),
    postCommands: Joi.array().items(Joi.string()).min(1),
  })).required(),
});

export const jobProtocolSchema = Joi.object().keys({
  protocolVersion: [Joi.string().required(), Joi.number().required()],
  name: Joi.string().required(),
  type: Joi.string().required(),
  version: Joi.string(),
  contributor: Joi.string(),
  description: Joi.string(),

  prerequisites: Joi.array().items(prerequisitesSchema).min(1),

  parameters: Joi.object(),
  secrets: Joi.object(),

  jobRetryCount: Joi.number().default(0),
  taskRoles: Joi.object().pattern(/^[a-zA-Z_][a-zA-Z0-9_]*$/, taskRoleSchema.required()),
  deployments: Joi.array().items(deploymentSchema).min(1),
  defaults: Joi.object().keys({
    virtualCluster: Joi.string(),
    deployment: Joi.string(),
  }),
  extras: Joi.object().keys({
    submitFrom: Joi.string(),
  }),
});

