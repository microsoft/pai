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

import { get, isNil, isEmpty } from 'lodash';
import { removeEmptyProperties } from '../utils/utils';
import { SECRET_PATTERN, DOCKER_OPTIONS } from '../utils/constants';

export class DockerInfo {
  constructor(props) {
    const { uri, auth, secretRef, name, isUseCustomizedDocker } = props;
    this.uri = uri || '';
    this.auth = auth || {};
    this.secretRef = !isEmpty(secretRef) ? secretRef : '';
    this.name = name || '';
    this.isUseCustomizedDocker = isUseCustomizedDocker || false;
  }

  static fromProtocol(dockerInfoProtocol, secrets) {
    let secretRef = get(dockerInfoProtocol, 'auth.password', '');
    let auth;
    if (!isNil(secretRef)) {
      let secretKey = SECRET_PATTERN.exec(secretRef);
      secretKey = isEmpty(secretKey) ? '' : secretKey[1];
      if (!isEmpty(secretKey) && !isNil(secrets[secretKey])) {
        auth = { ...dockerInfoProtocol.auth, password: secrets[secretKey] };
      } else {
        auth = {};
        secretRef = '';
      }
    }
    const isUseCustomizedDocker = DockerInfo.isUseCustomizedDocker(
      dockerInfoProtocol.uri,
    );
    return new DockerInfo({
      ...dockerInfoProtocol,
      auth: auth,
      secretRef: secretRef,
      isUseCustomizedDocker: isUseCustomizedDocker,
    });
  }

  static isUseCustomizedDocker(uri) {
    return isNil(
      DOCKER_OPTIONS.find(dockerOption => dockerOption.image === uri),
    );
  }

  convertToProtocolFormat() {
    const prunedAuth = { ...this.auth };
    if (!isEmpty(this.secretRef)) {
      prunedAuth.password = this.secretRef;
    }
    return removeEmptyProperties({
      type: 'dockerimage',
      auth: prunedAuth,
      uri: this.uri.trim(),
      name: this.name,
    });
  }
}
