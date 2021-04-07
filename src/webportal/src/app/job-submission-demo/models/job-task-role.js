// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { get } from 'lodash';

export class JobTaskRole {
  constructor(props) {
    const {
      dockerImage,
      instances,
      commands,
      taskRetryCount,
      completion,
      skuType,
      skuNum,
    } = props;
    this.dockerImage = dockerImage || '';
    this.instances = instances || 1;
    this.commands = commands || '';
    this.taskRetryCount = taskRetryCount || 0;
    this.completion = completion || {
      minFailedInstances: 0,
      minSucceedInstances: 0,
    };
    this.skuType = skuType || null;
    this.skuNum = skuNum || 0;
  }

  static fromProtocol(protocol, currentKey) {
    const taskRoleBase = get(protocol, `taskRoles['${currentKey}']`, {});
    const extraBase = get(
      protocol,
      `extras.hivedScheduler.taskRoles['${currentKey}']`,
      {},
    );
    return new JobTaskRole({ ...taskRoleBase, ...extraBase });
  }
}
