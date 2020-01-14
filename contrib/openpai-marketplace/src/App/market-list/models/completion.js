import { isNil } from 'lodash';

export class Completion {
  constructor(props) {
    const { minFailedInstances, minSucceededInstances } = props;
    this.minFailedInstances = minFailedInstances || 1;
    this.minSucceededInstances = minSucceededInstances || -1;
  }

  static fromProtocol(completionProtocol) {
    if (isNil(completionProtocol)) {
      return new Completion({});
    }

    return new Completion(completionProtocol);
  }

  convertToProtocolFormat() {
    return {
      minFailedInstances: this.minFailedInstances,
      minSucceededInstances: this.minSucceededInstances,
    };
  }
}
