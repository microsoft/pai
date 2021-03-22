// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import yaml from 'js-yaml';
import Joi from 'joi-browser';
import { isEmpty, cloneDeep } from 'lodash';
import { removeEmptyProperties } from '../utils/utils';
import { jobProtocolSchema } from '../models/protocol-schema';

export class JobProtocol {
  constructor(props) {
    const {
      name,
      description,
      contributor,
      jobRetryCount,
      prerequisites,
      defaults,
      taskRoles,
      parameters,
      secrets,
      extras,
      deployments,
    } = props;
    this.protocolVersion = 2;
    this.name = name || '';
    this.description = description || '';
    this.contributor = contributor || '';
    this.type = 'job';
    this.jobRetryCount = jobRetryCount || 0;
    this.prerequisites = prerequisites || [];
    this.parameters = parameters || {};
    this.taskRoles = taskRoles || {};
    this.deployments = deployments || {};
    this.secrets = secrets || {};
    this.defaults = defaults || {};
    this.extras = extras || {};
  }

  // make sure protocolYaml is valid before use this function
  static fromYaml(protocolYaml) {
    try {
      const jobProtocol = yaml.safeLoad(protocolYaml);
      return new JobProtocol(jobProtocol);
    } catch (e) {
      alert(e.message);
    }
  }

  // remove protocol empty properties and prune the blank line in the commands
  static safePruneProtocol(protocol) {
    const prunedProtocol = removeEmptyProperties(protocol);
    if (prunedProtocol.taskRoles) {
      const taskRoles = cloneDeep(prunedProtocol.taskRoles);
      Object.keys(taskRoles).forEach(taskRoleName => {
        const taskRoleContent = taskRoles[taskRoleName];
        if (isEmpty(taskRoleContent.commands)) {
          return;
        }
        taskRoleContent.commands = taskRoleContent.commands.filter(
          line => !isEmpty(line),
        );
      });
      prunedProtocol.taskRoles = taskRoles;
    }
    return prunedProtocol;
  }

  static validateFromObject(protocol) {
    const result = Joi.validate(
      JobProtocol.safePruneProtocol(protocol),
      jobProtocolSchema,
    );
    return String(result.error || '');
  }

  static validateFromYaml(protocolYaml) {
    try {
      const protocol = yaml.safeLoad(protocolYaml);
      return JobProtocol.validateFromObject(protocol);
    } catch (err) {
      return String(err.message);
    }
  }

  toYaml() {
    try {
      return yaml.safeDump(JobProtocol.safePruneProtocol(this));
    } catch (e) {
      alert(e.message);
    }
  }
}
