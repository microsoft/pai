import {isNil} from 'lodash';

export class Completion {
  constructor(props) {
    const {minFailedInstances, minSuceedInstances} = props;
    this.minFailedInstances = minFailedInstances || 1;
    this.minSuceedInstances = minSuceedInstances || null;
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
      minSuceedInstances: this.minSuceedInstances,
    };
  }
}
