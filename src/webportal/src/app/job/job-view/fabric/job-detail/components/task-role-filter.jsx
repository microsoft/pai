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
        ({
          containerExitSpec,
          containerNodeName,
          taskState,
          containerIp,
          containerId,
        }) =>
          (taskState &&
            taskState.toLowerCase().indexOf(keyword.toLowerCase()) > -1) ||
          (containerExitSpec &&
            containerExitSpec.type &&
            containerExitSpec.type
              .toLowerCase()
              .indexOf(keyword.toLowerCase()) > -1) ||
          (containerExitSpec &&
            containerExitSpec.code !== undefined &&
            containerExitSpec.code
              .toString()
              .toLowerCase()
              .indexOf(keyword.toLowerCase()) > -1) ||
          (containerNodeName &&
            containerNodeName.toLowerCase().indexOf(keyword.toLowerCase()) >
              -1) ||
          (containerIp &&
            containerIp.toLowerCase().indexOf(keyword.toLowerCase()) > -1) ||
          (containerId &&
            containerId.toLowerCase().indexOf(keyword.toLowerCase()) > -1),
      );
    }
    if (!isEmpty(exitType)) {
      filters.push(({ containerExitSpec }) => {
        return (
          containerExitSpec &&
          containerExitSpec.type &&
          exitType.has(containerExitSpec.type)
        );
      });
    }
    if (!isEmpty(exitCode)) {
      filters.push(({ containerExitSpec }) => {
        return (
          containerExitSpec &&
          containerExitSpec.code &&
          exitCode.has(containerExitSpec.code.toString())
        );
      });
    }
    if (!isEmpty(nodeName)) {
      filters.push(({ containerNodeName }) => nodeName.has(containerNodeName));
    }
    if (!isEmpty(statuses)) {
      filters.push(({ taskState }) => statuses.has(capitalize(taskState)));
    }
    if (filters.length === 0) return taskRoles;

    return taskRoles.filter((taskRole) =>
      filters.every((filter) => filter(taskRole)),
    );
  }
}

export default TaskRoleFilter;
