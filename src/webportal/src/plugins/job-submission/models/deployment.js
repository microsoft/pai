export class Deployment {
  constructor(props) {
    const {preCommands, postCommands} = props;
    this.preCommands = preCommands;
    this.postCommands = postCommands;
  }

  convertToProtocolFormat() {
    return {
      preCommands: this.preCommands,
      postCommands: this.postCommands,
    };
  }
}
