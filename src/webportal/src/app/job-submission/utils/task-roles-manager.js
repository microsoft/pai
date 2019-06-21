import {DockerInfo} from '../models/docker-info';

import {createUniqueName} from './utils';
import {isEmpty, get} from 'lodash';

const SECRET_PATTERN = /^<% \$secrets.([a-zA-Z_][a-zA-Z0-9_]*) %>/;
const SECRET_PREFIX = 'docker_password';
const DOCKER_IMAGE_PREFIX = 'docker_image';

let secretSeq = 0;
let dockerNameSeq = 0;

// This class will modify the taskRoles in-place
export class TaskRolesManager {
  constructor(taskRoles) {
    this.taskRoles = taskRoles;
    this.dockerInfoMap = this._generateDockerInfoMap();
  }

  getUpdatedSecretsAndLinkTaskRoles(secrets) {
    const updatedSecrets = Array.from(secrets);
    let isUpdated = false;

    this.taskRoles
      .filter((taskRole) =>!isEmpty(get(taskRole, 'dockerInfo.auth.password', '')))
      .forEach((taskRole) => {
        const dockerInfo = taskRole.dockerInfo;
        const password = dockerInfo.auth.password;
        const matchResults = SECRET_PATTERN.exec(dockerInfo.secretRef);
        if (!isEmpty(matchResults)) {
          const matchResult = matchResults[1];
          const findSecret = updatedSecrets.find(
            (secret) => secret.key === matchResult,
          );
          if (findSecret !== undefined && findSecret.value !== password) {
            findSecret.value = password;
            isUpdated = true;
          }

          // Remove auth from dockerMap if secret not exist
          if (findSecret === undefined) {
            dockerInfo.auth = {};
            dockerInfo.secretRef = '';
            isUpdated = true;
          }
        } else {
          // Add new secret here
          const [secretKey, updatedSeq] = createUniqueName(
            updatedSecrets.map((v) => v.key),
            SECRET_PREFIX,
            secretSeq,
          );
          updatedSecrets.push({key: secretKey, value: password});
          dockerInfo.secretRef = `<% $secrets.${secretKey} %>`;
          secretSeq = updatedSeq;
          isUpdated = true;
        }
      });
    return [updatedSecrets, isUpdated];
  }

  populateTaskRolesDockerInfo() {
    this.taskRoles.forEach((taskRole) => {
      const dockerInfo = taskRole.dockerInfo;
      const dockerInfoKey = TaskRolesManager._getDockerInfoKey(dockerInfo);
      if (!this.dockerInfoMap.has(dockerInfoKey)) {
        taskRole.dockerInfo = new DockerInfo({});
      }
      const mapInfo = this.dockerInfoMap.get(dockerInfoKey);
      dockerInfo.name = mapInfo.name;
      dockerInfo.secretRef = mapInfo.secretRef;
    });
  }

  static getTaskRolesPrerequisites(taskRoles) {
    const prerequistitesMap = new Map();
    taskRoles.forEach((taskRole) => {
      const dockerInfo = taskRole.dockerInfo;
      const dockerInfoKey = TaskRolesManager._getDockerInfoKey(dockerInfo);
      prerequistitesMap.set(dockerInfoKey, taskRole.getDockerPrerequisite());
    });

    return Array.from(prerequistitesMap.values());
  }

  _generateDockerInfoMap() {
    const dockerInfoMap = new Map();
    const usedNames = [];
    const usedSecretRefs = [];
    this.taskRoles.forEach((taskRole) => {
      const dockerInfo = taskRole.dockerInfo;
      const keyString = TaskRolesManager._getDockerInfoKey(dockerInfo);
      if (dockerInfoMap.has(keyString)) {
        return;
      }
      const name = this._generateDockerName(dockerInfo, usedNames);
      usedNames.push(name);

      let secretRef = dockerInfo.secretRef;
      if (this._isValidSecretKey(dockerInfo, usedSecretRefs)) {
        usedSecretRefs.push(secretRef);
      } else {
        secretRef = '';
      }

      dockerInfoMap.set(keyString, {name: name, secretRef: secretRef});
    });
    return dockerInfoMap;
  }

  _generateDockerName(dockerInfo, usedNames) {
    let name = dockerInfo.name;
    if (isEmpty(name) || usedNames.find((usedName) => usedName === name)) {
      [name, dockerNameSeq] = createUniqueName(
        usedNames,
        DOCKER_IMAGE_PREFIX,
        dockerNameSeq,
      );
    }

    return name;
  }

  _isValidSecretKey(dockerInfo, usedSecretRefs) {
    const secretRef = dockerInfo.secretRef;
    if (isEmpty(secretRef)) {
      return false;
    }

    const matchResults = SECRET_PATTERN.exec(secretRef);
    if (isEmpty(matchResults)) {
      return false;
    }

    if (usedSecretRefs.find((usedSecretRef) => usedSecretRef === secretRef)) {
      return false;
    }

    return true;
  }

  static _getDockerInfoKey(dockerInfo) {
    const keyObject = {uri: dockerInfo.uri, auth: dockerInfo.auth};
    const keyString = JSON.stringify(keyObject);
    return keyString;
  }
}
