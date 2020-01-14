import { DockerInfo } from '../models/docker-info';

import { createUniqueName } from './utils';
import { SECRET_PATTERN } from '../utils/constants';
import { isEmpty, get } from 'lodash';

const SECRET_PREFIX = 'docker_password';
const DOCKER_IMAGE_PREFIX = 'docker_image';

const UPDATE_FROM_TASKROLE_TO_SECRET = 'taskrole_to_secret';
const UPDATE_FROM_SECRET_TO_TASKROLE = 'secret_to_taskrole';

let secretSeq = 0;
let dockerNameSeq = 0;

// This class will modify the taskRoles in-place
export class TaskRolesManager {
  constructor(taskRoles) {
    this.taskRoles = taskRoles;
  }

  getUpdatedSecretsAndLinkTaskRoles(secrets) {
    const updatedSecrets = Array.from(secrets);
    let isUpdated = false;

    this.taskRoles
      .filter(
        taskRole => !isEmpty(get(taskRole, 'dockerInfo.auth.password', '')),
      )
      .forEach(taskRole => {
        const dockerInfo = taskRole.dockerInfo;
        const password = dockerInfo.auth.password;
        const secretKey = this._getSecretKey(dockerInfo.secretRef);
        if (!isEmpty(secretKey)) {
          isUpdated = this._populateDockerInfoWithSecret(
            dockerInfo,
            updatedSecrets,
            secretKey,
            UPDATE_FROM_TASKROLE_TO_SECRET,
          );
        } else {
          // Add new secret here
          const [secretKey, updatedSeq] = createUniqueName(
            updatedSecrets.map(v => v.key),
            SECRET_PREFIX,
            secretSeq,
          );
          updatedSecrets.push({ key: secretKey, value: password });
          dockerInfo.secretRef = `<% $secrets.${secretKey} %>`;
          secretSeq = updatedSeq;
          isUpdated = true;
        }
      });
    return [updatedSecrets, isUpdated];
  }

  populateTaskRolesWithUpdatedSecret(secrets) {
    let isUpdated = false;
    this.taskRoles
      .filter(taskRole => !isEmpty(get(taskRole, 'dockerInfo.secretRef', '')))
      .forEach(taskRole => {
        const dockerInfo = taskRole.dockerInfo;
        const secretKey = this._getSecretKey(dockerInfo.secretRef);
        if (!isEmpty(secretKey)) {
          isUpdated = this._populateDockerInfoWithSecret(
            dockerInfo,
            secrets,
            secretKey,
            UPDATE_FROM_SECRET_TO_TASKROLE,
          );
        } else {
          dockerInfo.auth = {};
          dockerInfo.secretRef = '';
          isUpdated = true;
        }
      });
    return isUpdated;
  }

  populateTaskRolesDockerInfo() {
    const dockerInfoMap = this._generateDockerInfoMap();
    this.taskRoles.forEach(taskRole => {
      const dockerInfo = taskRole.dockerInfo;
      const dockerInfoKey = TaskRolesManager._getDockerInfoKey(dockerInfo);
      if (!dockerInfoMap.has(dockerInfoKey)) {
        taskRole.dockerInfo = new DockerInfo({});
      }
      const mapInfo = dockerInfoMap.get(dockerInfoKey);
      dockerInfo.name = mapInfo.name;
      dockerInfo.secretRef = mapInfo.secretRef;
    });
  }

  static getTaskRolesPrerequisites(taskRoles) {
    const prerequistitesMap = new Map();
    taskRoles.forEach(taskRole => {
      const dockerInfo = taskRole.dockerInfo;
      const dockerInfoKey = TaskRolesManager._getDockerInfoKey(dockerInfo);
      prerequistitesMap.set(dockerInfoKey, taskRole.getDockerPrerequisite());
    });

    return Array.from(prerequistitesMap.values());
  }

  _getSecretKey(secretRef) {
    const matchResults = SECRET_PATTERN.exec(secretRef);
    if (isEmpty(matchResults)) {
      return '';
    }
    return matchResults[1];
  }

  _populateDockerInfoWithSecret(
    dockerInfo,
    secret,
    secretKey,
    updateDirection,
  ) {
    let isUpdated = false;
    const password = dockerInfo.auth.password;
    const findSecret = secret.find(secret => secret.key === secretKey);
    if (findSecret !== undefined && findSecret.value !== password) {
      if (updateDirection === UPDATE_FROM_TASKROLE_TO_SECRET) {
        findSecret.value = password;
      }
      if (updateDirection === UPDATE_FROM_SECRET_TO_TASKROLE) {
        dockerInfo.auth.password = findSecret.value;
      }
      isUpdated = true;
    }

    // Remove auth from dockerMap if secret not exist
    if (findSecret === undefined) {
      dockerInfo.auth = {};
      dockerInfo.secretRef = '';
      isUpdated = true;
    }
    return isUpdated;
  }

  _generateDockerInfoMap() {
    const dockerInfoMap = new Map();
    const usedNames = [];
    const usedSecretRefs = [];
    this.taskRoles.forEach(taskRole => {
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

      dockerInfoMap.set(keyString, { name: name, secretRef: secretRef });
    });
    return dockerInfoMap;
  }

  _generateDockerName(dockerInfo, usedNames) {
    let name = dockerInfo.name;
    if (isEmpty(name) || usedNames.find(usedName => usedName === name)) {
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

    if (usedSecretRefs.find(usedSecretRef => usedSecretRef === secretRef)) {
      return false;
    }

    return true;
  }

  static _getDockerInfoKey(dockerInfo) {
    const keyObject = { uri: dockerInfo.uri, auth: dockerInfo.auth };
    const keyString = JSON.stringify(keyObject);
    return keyString;
  }
}
