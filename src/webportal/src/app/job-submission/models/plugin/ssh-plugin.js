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

import {get, isNil, isEmpty} from 'lodash';
import {removeEmptyProperties} from '../../utils/utils';
import {SECRET_PATTERN, PAI_PLUGIN} from '../../utils/constants';

export class SSHPlugin {
  constructor(props) {
    const {jobssh, userssh, secretValue} = props;
    this.jobssh = jobssh || false;
    this.userssh = userssh || {};
    this.secretValue = secretValue || '';
  }

  static fromProtocol(extras, secrets) {
    const pluginBase = get(extras, PAI_PLUGIN, []);
    const sshPluginProtocol = pluginBase.find((plugin) => plugin['plugin'] === 'ssh');

    if (sshPluginProtocol === undefined) {
      return new SSHPlugin({});
    } else {
      const jobssh = get(sshPluginProtocol, 'parameters.jobssh', false);
      let userssh = get(sshPluginProtocol, 'parameters.userssh', {});

      let secretValue;
      if (get(userssh, 'type') === 'custom' && !isEmpty(get(userssh, 'value'))) {
        const secretRef = get(userssh, 'value');

        let secretKey = SECRET_PATTERN.exec(secretRef);
        secretKey = isEmpty(secretKey) ? '' : secretKey[1];
        const secret = secrets.find((secret) => secret.key === secretKey);
        secretValue = isNil(secret) ? '' : secret.value;
      } else {
        secretValue = '';
      }
      return new SSHPlugin({
        ...sshPluginProtocol,
        jobssh: jobssh,
        userssh: userssh,
        secretValue: secretValue,
      });
    }
  }

  convertToProtocolFormat() {
    return removeEmptyProperties({
      plugin: 'ssh',
      parameters: {
        jobssh: this.jobssh,
        userssh: this.userssh,
      },
    });
  }

  getUserSshValue() {
    if (get(this.userssh, 'type') === 'custom') {
      return this.secretValue;
    } else {
      return get(this.userssh, 'value');
    }
  }
}
