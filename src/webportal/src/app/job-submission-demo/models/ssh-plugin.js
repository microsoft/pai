// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { get } from 'lodash';
import { removeEmptyProperties } from '../../job-submission/utils/utils';
import { PAI_PLUGIN } from '../utils/constants';

export class SSHPlugin {
  constructor(props) {
    const { userssh } = props;
    // this.jobssh = jobssh || false;
    this.userssh = userssh || {};
  }

  static fromProtocol(protocol) {
    const pluginBase = get(protocol, `extras['${PAI_PLUGIN}']`, []);
    const sshPluginProtocol = pluginBase.find(
      plugin => plugin.plugin === 'ssh',
    );

    if (sshPluginProtocol === undefined) {
      return new SSHPlugin({});
    } else {
      const userssh = get(sshPluginProtocol, 'parameters.userssh', {});
      return new SSHPlugin({
        ...sshPluginProtocol,
        userssh: userssh,
      });
    }
  }

  convertToProtocolFormat() {
    return removeEmptyProperties({
      plugin: 'ssh',
      parameters: {
        userssh: this.userssh,
      },
    });
  }

  getUserSSHValue() {
    return get(this.userssh, 'value');
  }
}
