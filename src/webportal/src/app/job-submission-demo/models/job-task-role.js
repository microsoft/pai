// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { get, isEmpty, isNil } from 'lodash';
import { Completion } from './completion';
import { removeEmptyProperties } from '../utils/utils';
import config from '../../config/webportal.config';

export class JobTaskRole {
  constructor(props) {
    const {
      name,
      dockerImage,
      instances,
      commands,
      ports,
      taskRetryCount,
      completion,
      hivedSku,
    } = props;
    this.name = name || '';
    this.instances = instances || 1;
    this.dockerImage = dockerImage || 'docker_image_0';
    this.commands = commands || '';
    this.ports = ports || [];
    this.taskRetryCount = taskRetryCount || 0;
    this.completion = completion || new Completion({});
    this.hivedSku = hivedSku || { skuNum: 1, skuType: null, sku: null };
  }

  static fromProtocol(protocol, currentKey) {
    const taskRoleProtocol = get(protocol, `taskRoles.${currentKey}`, {});
    const extraProtocol = get(
      protocol,
      `extras.hivedScheduler.taskRoles.${currentKey}`,
      {},
    );
    const instances = get(taskRoleProtocol, 'instances', 1);
    const dockerImage = get(taskRoleProtocol, 'dockerImage');
    const commands = get(taskRoleProtocol, 'commands', []);
    const resourcePerInstance = get(
      taskRoleProtocol,
      'resourcePerInstance',
      {},
    );

    const taskRetryCount = get(taskRoleProtocol, 'taskRetryCount', 0);
    const completion = get(taskRoleProtocol, 'completion', {});

    const skuNum = get(extraProtocol, 'skuNum', 1);
    const skuType = get(extraProtocol, 'skuType', null);

    const ports = isNil(resourcePerInstance.ports)
      ? []
      : Object.entries(resourcePerInstance.ports).map(([key, value]) => ({
          key,
          value: value.toString(),
        }));

    const hivedSku = { skuNum: 1, skuType: null, sku: null };
    if (config.launcherScheduler === 'hivedscheduler') {
      hivedSku.skuNum = skuNum;
      hivedSku.skuType = skuType;
    }

    const jobTaskRole = new JobTaskRole({
      name: currentKey,
      instances: instances,
      dockerImage: dockerImage,
      commands: isNil(commands) ? '' : commands.join('\n'),
      ports: ports,
      taskRetryCount: taskRetryCount,
      completion: Completion.fromProtocol(completion),
      hivedSku: hivedSku,
    });

    return jobTaskRole;
  }

  convertToProtocolFormat() {
    const ports = this.ports.reduce((val, x) => {
      if (typeof x.value === 'string') {
        val[x.key] = parseInt(x.value);
      } else {
        val[x.key] = x.value;
      }
      return val;
    }, {});
    const resourcePerInstance = removeEmptyProperties({
      ...this.containerSize,
      ports: ports,
    });
    if (
      config.launcherScheduler === 'hivedscheduler' &&
      this.hivedSku.sku != null
    ) {
      [['gpu', 'gpu'], ['cpu', 'cpu'], ['memoryMB', 'memory']].forEach(
        ([k1, k2]) => {
          resourcePerInstance[k1] =
            this.hivedSku.skuNum * this.hivedSku.sku[k2];
        },
      );
    }

    const taskRole = removeEmptyProperties({
      instances: this.instances,
      dockerImage: this.dockerImage,
      resourcePerInstance: resourcePerInstance,
      taskRetryCount: this.taskRetryCount,
      completion: this.completion,
      commands: isEmpty(this.commands)
        ? []
        : this.commands.split('\n').map(line => line.trim()),
    });
    const hivedTaskRole = {
      skuNum: this.hivedSku.skuNum,
      skuType: this.hivedSku.skuType,
    };
    return [taskRole, hivedTaskRole];
  }
}
