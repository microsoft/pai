export class Deployment {
  constructor(props) {
    const {preCommands, postCommands} = props;
    this.preCommands = preCommands;
    this.postCommands = postCommands;
  }
}
