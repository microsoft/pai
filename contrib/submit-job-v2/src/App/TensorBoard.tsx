import React from "react";
import {
  ComboBox, IComboBox, IComboBoxOption, Toggle, Callout, DefaultButton, Dropdown, DropdownMenuItemType,
  Fabric, IDropdownOption, Stack, PrimaryButton, TextField, mergeStyleSets, enableBodyScroll,
} from "office-ui-fabric-react";

interface ILogDirectoryObj {
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
  logDirectories: ILogDirectoryObj;
}

interface ITensorBoardProps {
  externalStorageTypeOptions: IComboBoxOption[];
  enableTensorBoard: boolean;
  setTensorBoardConfig: ((tensorBoardConfig: ITensorBoardConfig) => void);
  toggleTensorBoard: ((checked: boolean) => void);
}

interface ITensorBoardState {
  tensorBoardConfig: ITensorBoardConfig,
  enableTensorBoard: boolean,
}

const defaultExternalStorageTypeOptions: IComboBoxOption[] = [
  { key: "HDFS", text: "HDFS" },
  { key: "NFS", text: "NFS" },
];

export default class TensorBoard extends React.Component<ITensorBoardProps, ITensorBoardState> {
  public static defaultProps: Partial<ITensorBoardProps> = {
    enableTensorBoard: false,
    externalStorageTypeOptions: defaultExternalStorageTypeOptions,
  };

  public state = {
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

  public render() {
    return (
      <Stack>
        <Toggle
          label="Enable TensorBoard"
          checked={this.state.enableTensorBoard}
          onChange={this.toggleTensorBoard.bind(this)}
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
              placeholder={`9000`}
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
      const logDirectories = this.state.tensorBoardConfig.logDirectories as ILogDirectoryObj;
      Object.keys(logDirectories).forEach((key) => {
        logPathList.push(`${key}:${logDirectories[key]}`);
      });
      const logPath = logPathList.join(":");
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
      this.setState({ enableTensorBoard: checked });
      this.props.toggleTensorBoard(checked);
    }
  }

  private setHostIP = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, hostIP?: string) => {
    if (hostIP !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.hostIP = hostIP;
      this.setState({ tensorBoardConfig });
      this.props.setTensorBoardConfig(tensorBoardConfig);
    }
  }

  private setPort = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, port?: string) => {
    if (port !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.port = port;
      this.setState({ tensorBoardConfig });
      this.props.setTensorBoardConfig(tensorBoardConfig);
    }
  }

  private setRemotePath = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, remotePath?: string) => {
    if (remotePath !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.remotePath = remotePath;
      this.setState({ tensorBoardConfig });
      this.props.setTensorBoardConfig(tensorBoardConfig);
    }
  }

  private setType = (event: React.FormEvent<IComboBox>, option?: IComboBoxOption, index?: number, value?: string) => {
    if (option !== undefined) {
      const tensorBoardConfig = this.state.tensorBoardConfig;
      tensorBoardConfig.storage.type = option.key.toString();
      this.setState({ tensorBoardConfig });
      this.props.setTensorBoardConfig(tensorBoardConfig);
    }
  }
}