import React from "react";
import { ComboBox, IComboBox, IComboBoxOption, Toggle, Stack, TextField } from "office-ui-fabric-react";
import update from "immutability-helper";

interface IArrayObj {
  [key: string]: string;
}

interface IStorage {
  type: string;
  hostIP: string;
  port: string;
  remotePath: string;
}

interface ITensorBoardConfig {
  randomStr: string;
  storage: IStorage;
  logDirectories: IArrayObj;
}

interface ITensorBoardProps {
  protocol: any;
  setProtocol: ((protocol: any) => void);
}

interface ITensorBoardState {
  protocol: any;
  tensorBoardConfig: ITensorBoardConfig;
  enableTensorBoard: boolean;
}

const defaultExternalStorageTypeOptions: IComboBoxOption[] = [
  { key: "HDFS", text: "HDFS" },
  { key: "NFS", text: "NFS" },
];

export default class TensorBoard extends React.Component<ITensorBoardProps, ITensorBoardState> {
  public static defaultProps: Partial<ITensorBoardProps> = {
    protocol: Object.create(null),
  };

  public state = {
    protocol: this.props.protocol,
    tensorBoardConfig: {
      randomStr: "",
      storage: {
        type: "HDFS",
        hostIP: "",
        port: "",
        remotePath: "",
      },
      logDirectories: {
        default: "$TB_ROOT",
      },
    },
    enableTensorBoard: false,
    externalStorageTypeOptions: defaultExternalStorageTypeOptions,
  };

  public componentWillMount() {
    const protocol = this.props.protocol;
    let tensorBoardConfig = {
      randomStr: "",
      storage: {
        type: "HDFS",
        hostIP: "",
        port: "",
        remotePath: "",
      },
      logDirectories: {
        default: "$TB_ROOT",
      },
    };
    let enableTensorBoard = false;
    if (protocol && protocol.extras && protocol.extras.tensorBoard) {
      tensorBoardConfig = protocol.extras.tensorBoard;
      enableTensorBoard = true;
    }
    this.setState(({
      tensorBoardConfig,
      protocol,
      enableTensorBoard,
    }),
      () => {
        this.updateProtocol();
      },
    );
  }

  public componentWillReceiveProps(nextProps: ITensorBoardProps) {
    const { protocol } = nextProps;
    let tensorBoardConfig = {
      randomStr: "",
      storage: {
        type: "HDFS",
        hostIP: "",
        port: "",
        remotePath: "",
      },
      logDirectories: {
        default: "$TB_ROOT",
      },
    };
    let enableTensorBoard = false;
    if (protocol && protocol.extras && protocol.extras.tensorBoard) {
      tensorBoardConfig = protocol.extras.tensorBoard;
      enableTensorBoard = true;
    }
    if (protocol !== this.state.protocol) {
      this.setState(({
        tensorBoardConfig,
        protocol,
        enableTensorBoard,
      }),
        () => {
          this.updateProtocol();
        },
      );
    }

  }

  public render() {
    return (
      <Stack>
        <Toggle
          label="TensorBoard"
          checked={this.state.enableTensorBoard}
          onChange={this.toggleTensorBoard}
          inlineLabel={true}
        />
        {this.renderTensorBoardStorage()}
        {this.renderTensorBoardLogPath()}
      </Stack>
    );
  }

  private renderTensorBoardStorage = () => {
    if (this.state.enableTensorBoard) {
      return (
        <div>
          <ComboBox
            label="Storage Type"
            onChange={this.setType}
            text={this.state.tensorBoardConfig.storage.type}
            options={this.state.externalStorageTypeOptions}
          />
          {this.renderTensorBoardStorageParameters()}
        </div>
      );
    }
  }

  private renderTensorBoardStorageParameters = () => {
    switch (this.state.tensorBoardConfig.storage.type) {
      case "HDFS":
        return (
          <div>
            <TextField
              label="Host IP"
              value={this.state.tensorBoardConfig.storage.hostIP}
              onChange={this.setHostIP}
              required={true}
            />
            <TextField
              label="Port"
              value={this.state.tensorBoardConfig.storage.port}
              onChange={this.setPort}
              required={true}
            />
            <TextField
              label="Remote Path"
              value={this.state.tensorBoardConfig.storage.remotePath}
              onChange={this.setRemotePath}
              required={true}
            />
          </div>
        );
        break;
      case "NFS":
        return (
          <div>
            <TextField
              label="Host IP"
              value={this.state.tensorBoardConfig.storage.hostIP}
              onChange={this.setHostIP}
              required={true}
            />
            <TextField
              label="Remote Path"
              value={this.state.tensorBoardConfig.storage.remotePath}
              onChange={this.setRemotePath}
              required={true}
            />
          </div>
        );
        break;
    }
  }

  private renderTensorBoardLogPath = () => {
    if (this.state.enableTensorBoard) {
      const logPathList: string[] = [];
      const logDirectories = this.state.tensorBoardConfig.logDirectories as IArrayObj;
      Object.keys(logDirectories).forEach((key) => {
        logPathList.push(`${key}:${logDirectories[key]}`);
      });
      const logPath = logPathList.join(",");
      return (
        <TextField
          label="Log Path"
          value={logPath}
          readOnly={true}
        />
      );
    }
  }

  private toggleTensorBoard = (event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) => {
    if (checked !== undefined) {
      this.setState(
        ({ enableTensorBoard: checked }),
        () => { this.updateProtocol(); },
      );
    }
  }

  private setHostIP = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, hostIP?: string) => {
    if (hostIP !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.hostIP = hostIP;
      this.setState(
        ({ tensorBoardConfig }),
        () => { this.updateProtocol(); },
      );
    }
  }

  private setPort = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, port?: string) => {
    if (port !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.port = port;
      this.setState(
        ({ tensorBoardConfig }),
        () => { this.updateProtocol(); },
      );
    }
  }

  private setRemotePath = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, remotePath?: string) => {
    if (remotePath !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.remotePath = remotePath;
      this.setState(
        ({ tensorBoardConfig }),
        () => { this.updateProtocol(); },
      );
    }
  }

  private setType = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption, index?: number, value?: string) => {
    if (option !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.type = option.key.toString();
      this.setState(
        ({ tensorBoardConfig }),
        () => { this.updateProtocol(); },
      );
    }
  }

  private generatePreCommand = () => {
    let preCommand = [];
    let mountPath = "/TMP_TENSORBOARD_LOG";
    const storageConfig = this.state.tensorBoardConfig.storage;
    preCommand.push("`#TENSORBOARD_STORAGE_START`");
    preCommand.push("`#Auto generated code, please do not modify`");
    preCommand.push(
      `if [ ! -d ${mountPath} ]; then mkdir --parents ${
      mountPath
      }; fi`,
    );
    preCommand.push("apt-get update");
    switch (storageConfig.type) {
      case "HDFS":
        preCommand.push([
          "apt-get install -y git fuse golang",
          "git clone --recursive https://github.com/Microsoft/hdfs-mount.git",
          "cd hdfs-mount",
          "make",
          "cp hdfs-mount /bin",
          "cd ..",
          "rm -rf hdfs-mount",
        ].join("&&"));
        if (storageConfig.hostIP === undefined || storageConfig.remotePath === undefined) {
          preCommand = [];
          break;
        }
        preCommand.push(`(hdfs-mount ${storageConfig.hostIP}:${storageConfig.port} ${mountPath} &)`);
        preCommand.push(`sleep 5`);
        mountPath += storageConfig.remotePath;
        break;
      case "NFS":
        if (storageConfig.hostIP === undefined || storageConfig.remotePath === undefined) {
          preCommand = [];
          break;
        }
        preCommand.push("apt-get install -y nfs-common");
        preCommand.push(`mount -t nfs4 ${storageConfig.hostIP}:${storageConfig.remotePath} ${mountPath}`);
        break;
      default:
        preCommand = [];
        break;
    }
    if (preCommand.length === 0) {
      alert("Please complete the storage config!");
      return [];
    }
    preCommand.push(`export TB_ROOT=${mountPath}`);
    preCommand.push("`#TENSORBOARD_STORAGE_END`");
    return preCommand;
  }

  private injectCommand = () => {
    const preCommand = this.generatePreCommand();
    if (preCommand.length === 0) {
      return false;
    }
    const protocol = this.state.protocol;
    if (protocol && protocol.taskRoles) {
      const obj = protocol.taskRoles;
      Object.keys(obj).forEach((key) => {
        obj[key].commands = preCommand.concat(obj[key].commands);
      });
      this.setState({ protocol });
    }
  }

  private addTensorBoardConfig = () => {
    const protocol = this.state.protocol;
    if (protocol === undefined) {
      return;
    }
    const tensorBoardConfig = this.state.tensorBoardConfig;
    tensorBoardConfig.randomStr = Math.random().toString(36).slice(2, 10);
    if (protocol && protocol.extras) {
      protocol.extras.tensorBoard = tensorBoardConfig;
    } else {
      protocol.extras = { tensorBoard: tensorBoardConfig };
    }
    this.setState({
      protocol,
      tensorBoardConfig,
    });
    this.addTensorBoardTaskRole();
    this.injectCommand();
  }

  private addTensorBoardTaskRole = () => {
    const protocol = this.state.protocol;
    const tensorBoardConfig = this.state.tensorBoardConfig;
    const tensorBoardName = `TensorBoard_${tensorBoardConfig.randomStr}`;
    const tensorBoardImage = `tensorBoardImage_${tensorBoardConfig.randomStr}`;
    const tensorBoardPort = `tensorBoardPort_${tensorBoardConfig.randomStr}`;

    if (!protocol.prerequisites) {
      protocol.prerequisites = [];
    }
    protocol.prerequisites = update(protocol.prerequisites, {
      $push: [{
        protocolVersion: 2,
        name: tensorBoardImage,
        type: "dockerimage",
        version: "1.0 - r1.4",
        contributor: "OpenPAI",
        uri: "openpai/pai.example.tensorflow",
      }],
    });

    const portList = ` --port=$PAI_CONTAINER_HOST_${tensorBoardPort}_PORT_LIST`;
    const logPathList: string[] = [];
    const logDirectories = tensorBoardConfig.logDirectories as IArrayObj;
    Object.keys(logDirectories).forEach((key) => {
      logPathList.push(`${key}:${logDirectories[key]}`);
    });
    const logPath = logPathList.join(":");

    if (!protocol.taskRoles) {
      protocol.taskRoles = {};
    }
    const minSucceededInstances = Object.getOwnPropertyNames(protocol.taskRoles).length;
    protocol.taskRoles[tensorBoardName] = {
      instances: 1,
      completion: {
        minFailedInstances: 1,
        minSucceededInstances: minSucceededInstances <= 0 ? null : minSucceededInstances,
      },
      taskRetryCount: 0,
      dockerImage: tensorBoardImage,
      resourcePerInstance:
      {
        cpu: 4,
        memoryMB: 8192,
        gpu: 0,
        ports: {},
      },
      commands: [`tensorboard --logdir=${logPath} ${portList}`],
    };
    protocol.taskRoles[tensorBoardName].resourcePerInstance.ports[tensorBoardPort] = 1;
    this.setState({ protocol });
  }

  private deleteTensorBoardConfig = () => {
    const protocol = this.state.protocol;
    const randomStr = this.state.tensorBoardConfig.randomStr;
    const tensorBoardName = `TensorBoard_${randomStr}`;
    const tensorBoardImage = `tensorBoardImage_${randomStr}`;
    if (protocol && protocol.taskRoles) {
      delete protocol.taskRoles[tensorBoardName];
      Object.keys(protocol.taskRoles).forEach((key) => {
        const startIndex = protocol.taskRoles[key].commands.indexOf("`#TENSORBOARD_STORAGE_START`");
        const endIndex = protocol.taskRoles[key].commands.indexOf("`#TENSORBOARD_STORAGE_END`");
        if (startIndex !== -1 && endIndex !== -1) {
          protocol.taskRoles[key].commands.splice(startIndex, endIndex - startIndex + 1);
        }
      });
      if (Object.getOwnPropertyNames(protocol.taskRoles).length === 0) {
        delete protocol.taskRoles;
      }
    }
    if (protocol && protocol.prerequisites) {
      const index = protocol.prerequisites.findIndex((ele: any) => ele.name === tensorBoardImage);
      if (index !== -1) {
        protocol.prerequisites.splice(index, 1);
      }
      if (protocol.prerequisites.length === 0) {
        delete protocol.prerequisites;
      }
    }
    if (protocol && protocol.extras && protocol.extras.tensorBoard) {
      delete protocol.extras.tensorBoard;
      if (Object.getOwnPropertyNames(protocol.extras).length === 0) {
        delete protocol.extras;
      }
    }
    this.setState({ protocol });
  }

  private updateProtocol = () => {
    this.deleteTensorBoardConfig();
    if (this.state.enableTensorBoard) {
      this.addTensorBoardConfig();
    }
    this.props.setProtocol(this.state.protocol);
  }
}
