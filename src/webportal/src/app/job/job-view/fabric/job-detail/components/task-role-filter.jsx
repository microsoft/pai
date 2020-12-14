// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { capitalize, isEmpty } from 'lodash';

class TaskRoleFilter {
  /**
   * @param {string} keyword
   * @param {Set<string>?} statuses
   * @param {Set<string>?} exitType
   * @param {Set<string>?} exitCode
   * @param {Set<string>?} nodeName
   */
  constructor(
    keyword = '',
    statuses = new Set(),
    exitType = new Set(),
    exitCode = new Set(),
    nodeName = new Set(),
  ) {
    this.keyword = keyword;
    this.statuses = statuses;
    this.exitType = exitType;
    this.exitCode = exitCode;
    this.nodeName = nodeName;
  }

  /**
   * @param {any[]} taskRoles
   */
  apply(taskRoles) {
    const { keyword, statuses, exitType, exitCode, nodeName } = this;

    const filters = [];
    if (keyword !== '') {
      filters.push(
        ({ exitType, exitCode, nodeName }) =>
          exitType.indexOf(keyword) > -1 ||
          exitCode.indexOf(keyword) > -1 ||
          nodeName.indexOf(keyword) > -1,
      );
    }
    if (!isEmpty(exitType)) {
      filters.push(({ exitType }) => exitType.has(exitType));
    }
    if (!isEmpty(exitCode)) {
      filters.push(({ exitCode }) => exitCode.has(exitCode));
    }
    if (!isEmpty(nodeName)) {
      filters.push(({ nodeName }) => nodeName.has(nodeName));
    }
    if (!isEmpty(statuses)) {
      filters.push(({ taskState }) => statuses.has(capitalize(taskState)));
    }
    if (filters.length === 0) return taskRoles;

    return taskRoles.filter(taskRole =>
      filters.every(filter => filter(taskRole)),
    );
  }
}

export default TaskRoleFilter;
