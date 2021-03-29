// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { isEmpty, get } from 'lodash';

let dockerImageSeq = 0;

export class DockerInfo {
  static getDockerInfoByUri(prerequisites, uri) {
    const prerequisite = prerequisites.find(
      item =>
        item.type === 'dockerimage' && item.uri === uri && isEmpty(item.auth),
    );
    return !isEmpty(prerequisite) ? prerequisite.name : null;
  }

  static addDockerInfo(prerequisites, dockerUri) {
    const newItems = Object.assign([], prerequisites);
    const dockerImageName = 'docker_image_' + ++dockerImageSeq;
    newItems.push({
      type: 'dockerimage',
      uri: dockerUri,
      name: dockerImageName,
    });
    return [newItems, dockerImageName];
  }

  static addAuthDockerInfo(
    prerequisites,
    taskRoles,
    currentTaskRole,
    dockerName,
    authInfo,
  ) {
    const isUnique = this.isUniqueInTaskRoles(
      taskRoles,
      currentTaskRole,
      dockerName,
    );
    let updatePrerequisites, updateName;
    if (isUnique) {
      updateName = dockerName;
      updatePrerequisites = prerequisites.map(prerequisite => {
        const { name, type } = prerequisite;
        const isCurrent = type === 'dockerimage' && name === dockerName;
        return {
          ...prerequisite,
          ...(isCurrent ? { auth: authInfo } : {}),
        };
      });
      return updatePrerequisites;
    } else {
      let dockerUri;
      for (const prerequisite of prerequisites) {
        if (prerequisite.name === dockerName) {
          dockerUri = prerequisite.uri;
        }
      }
      updateName = 'docker_image_' + ++dockerImageSeq;
      updatePrerequisites = Object.assign([], prerequisites);
      updatePrerequisites.push({
        type: 'dockerimage',
        uri: dockerUri,
        updateName,
        auth: authInfo,
      });
    }
    return [updatePrerequisites, updateName];
  }

  static removeSafeDockerInfo(prerequisites, taskRoles, currentTaskRole, name) {
    for (const key in taskRoles) {
      if (key !== currentTaskRole && taskRoles[key].dockerImage === name) {
        return prerequisites;
      }
    }
    return prerequisites.filter(
      prerequisite =>
        prerequisite.type !== 'dockerimage' || prerequisite.name !== name,
    );
  }

  static isUniqueInTaskRoles(taskRoles, currentTaskRole, dockerName) {
    for (const key in taskRoles) {
      if (key !== currentTaskRole) {
        const taskRole = taskRoles[key];
        if (Object.prototype.hasOwnProperty.call(taskRole, 'dockerImage')) {
          const name = get(taskRole, 'dockerImage');
          if (dockerName === name) return false;
        }
      }
    }
    return true;
  }

  static changeDockerInfo(prerequisites, prevName, dockerUri, isUnique) {
    const currentName = this.getDockerInfoByUri(prerequisites, dockerUri);
    let items, name;
    if (isEmpty(currentName)) {
      if (isUnique) {
        name = prevName;
        items = prerequisites.map(prerequisite => {
          const { name, type } = prerequisite;
          const isCurrent = type === 'dockerimage' && name === prevName;
          return {
            ...prerequisite,
            ...(isCurrent ? { uri: dockerUri } : {}),
          };
        });
      } else {
        name = 'docker_image_' + ++dockerImageSeq;
        items = Object.assign([], prerequisites);
        items.push({ type: 'dockerimage', uri: dockerUri, name });
      }
    } else {
      name = currentName;
      if (isUnique) {
        items = prerequisites.filter(prerequisite => {
          const { name, type } = prerequisite;
          return type !== 'dockerimage' || name !== prevName;
        });
      } else {
        items = prerequisites;
      }
    }
    return [items, name];
  }
}
