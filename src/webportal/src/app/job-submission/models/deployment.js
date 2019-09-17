import { isEmpty, isNil } from 'lodash';
import { removeEmptyProperties } from '../utils/utils';

export class Deployment {
  constructor(props) {
    const { preCommands, postCommands } = props;
    this.preCommands = preCommands || '';
    this.postCommands = postCommands || '';
  }

  static fromProtocol(deploymentProtocol) {
    const { preCommands, postCommands } = deploymentProtocol;
    const updatedPreCommands = isNil(preCommands) ? '' : preCommands.join('\n');
    const updatedPostCommands = isNil(postCommands)
      ? ''
      : postCommands.join('\n');
    return new Deployment({
      preCommands: updatedPreCommands,
      postCommands: updatedPostCommands,
    });
  }

  convertToProtocolFormat() {
    return removeEmptyProperties({
      preCommands: isEmpty(this.preCommands)
        ? []
        : this.preCommands.trim().split('\n'),
      postCommands: isEmpty(this.postCommands)
        ? []
        : this.postCommands.trim().split('\n'),
    });
  }
}
