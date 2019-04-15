// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import React, { Suspense, lazy } from "react";
import {
  ChoiceGroup, DefaultButton, Fabric, Label, List, Panel, PanelType,
  PrimaryButton, Stack, Spinner, SpinnerSize, Text, TextField, Toggle,
  initializeIcons, mergeStyleSets,
} from "office-ui-fabric-react";
import classNames from "classnames/bind";
import update from "immutability-helper";
import yaml from "yaml";

import monacoStyles from "./monaco.scss";

const MonacoEditor = lazy(() => import("react-monaco-editor"));
const styles = mergeStyleSets({
  form: {
    width: "50%",
    marginTop: "20px",
    alignSelf: "center",
    boxSizing: "border-box",
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.2)",
    borderStyle: "1px solid rgba(0, 0, 0, 0.2)",
    borderRadius: "6px",
    backgroundColor: "#fff",
  },

  title: {
    fontWeight: "600",
  },

  subTitle: {
    fontSize: "16px",
    fontWeight: "300",
    color: "#777",
  },

  header: {
    width: "80%",
    alignItems: "center",
    paddingBottom: "10px",
    marginBottom: "10px",
    borderBottom: "1px solid #e5e5e5",
  },

  footer: {
    width: "80%",
    alignItems: "flex-end",
    paddingTop: "20px",
    marginTop: "10px",
    borderTop: "1px solid #e5e5e5",
  },

  spinner: {
    alignItems: "center",
  },

  item: {
    width: "80%",
    paddingRight: "20%",
  },

  topGap: {
    marginTop: "15px",
  },

  rightGap: {
    marginRight: "10px",
  },

  choiceGroupItem: {
    display: "flex",
    alignItems: "baseline",
  },

  fileLabel: {
    width: "25%",
    position: "relative",
    minHeight: "1px",
    padding: "0",
  },

  fileBtn: {
    fontSize: "14px",
    fontWeight: "400",
    boxSizing: "border-box",
    display: "inline-block",
    textAlign: "center",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    cursor: "pointer !important",
    touchAction: "manipulation",
    padding: "4px 16px",
    minWidth: "80px",
    height: "32px",
    backgroundColor: "rgb(244, 244, 244)",
    color: "rgb(51, 51, 51) !important",
    userSelect: "none",
    outline: "transparent",
    border: "1px solid transparent",
    borderRadius: "0px",
    textDecoration: "none !important",
  },

  fileDisabled: {
    cursor: "not-allowed",
    filter: "alpha(opacity=60)",
    opacity: "0.60",
    boxShadow: "none",
    color: "rgb(166, 166, 166)",
    pointerEvents: "none",
  },

  fileInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: "0",
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    border: "0",
  },
});
const cx = classNames.bind(styles);

initializeIcons();

interface IParameterObj {
  [key: string]: string;
}

interface IParameterItem {
  key: string;
  value: string;
}

interface IProtocolProps {
  api: string;
  user: string;
  token: string;
  source ?: {
    jobName: string;
    user: string;
  };
}

interface IProtocolState {
  jobName: string;
  protocol: any;
  protocolYAML: string;
  loading: boolean;
  showParameters: boolean;
  showEditor: boolean;
}

export default class ProtocolForm extends React.Component<IProtocolProps, IProtocolState> {
  public state = {
    jobName: "",
    protocol: Object.create(null),
    protocolYAML: "",
    loading: true,
    showParameters: true,
    showEditor: false,
  };

  public componentDidMount() {
    this.fetchConfig();
  }

  public render() {
    return this.state.loading ?
    this.renderLoading() :
    this.readerContent();
  }

  private renderLoading = () => {
    return (
      <Fabric>
        <Stack>
          <Stack gap={10} padding={20} horizontalAlign="center" className={styles.form}>
            <Stack className={styles.header}>
            <Text variant="xxLarge" nowrap={true} block={true} className={styles.title}>
              Submit Job v2 <span className={styles.subTitle}>Protocol Preview</span>
            </Text>
            </Stack>
            <Stack className={styles.spinner}>
              <Spinner
                label="Loading Cloned Job ..."
                ariaLive="assertive"
                labelPosition="left"
                size={SpinnerSize.large}
              />
            </Stack>
          </Stack>
        </Stack>
      </Fabric>
    );
  }

  private readerContent = () => {
    const editorSpinner = (
      <Spinner
        label="Loading YAML Editor ..."
        ariaLive="assertive"
        labelPosition="left"
        size={SpinnerSize.large}
      />
    );

    const uploadOptions = [
      {
        key: "local",
        text: "",
        onRenderField: (props: any, render: any) => {
          return (
            <div className={styles.choiceGroupItem}>
              {render!(props)}
              <Label className={styles.rightGap}>Upload from local disk</Label>
              <label className={styles.fileLabel}>
                <a className={cx({fileBtn: true, fileDisabled: !(props && props.checked)})}>
                  Import
                </a>
                <input
                  type="file"
                  className={styles.fileInput}
                  accept=".yml,.yaml"
                  onChange={this.importFile}
                  disabled={props ? !props.checked : false}
                />
              </label>
            </div>
          );
        },
      },
      {
        key: "marketplace",
        text: "",
        onRenderField: (props: any, render: any) => {
          return (
            <div className={styles.choiceGroupItem}>
              {render!(props)}
              <Label className={styles.rightGap}>Select from marketplace</Label>
            </div>
          );
        },
      },
    ];

    return (
      <Fabric>
        <Panel
          isOpen={this.state.showEditor}
          isLightDismiss={true}
          onDismiss={this.closeEditor}
          type={PanelType.largeFixed}
          headerText="Protocol YAML Editor"
        >
          <div className={monacoStyles.monacoHack}>
            <Suspense fallback={editorSpinner}>
              <MonacoEditor
                width={800}
                height={800}
                value={this.state.protocolYAML}
                onChange={this.editProtocol}
                language="yaml"
                theme="vs-dark"
                options={{ wordWrap: "on", readOnly: false }}
              />
            </Suspense>
          </div>
          <div className={styles.topGap}>
            <PrimaryButton text="Save" onClick={this.saveEditor} className={styles.rightGap} />
            <DefaultButton text="Discard" onClick={this.discardEditor} />
          </div>
        </Panel>

        <Stack>
          <Stack gap={10} padding={20} horizontalAlign="center" className={styles.form}>
            <Stack className={styles.header}>
              <Text variant="xxLarge" nowrap={true} block={true} className={styles.title}>
                Submit Job v2 <span className={styles.subTitle}>Protocol Preview</span>
              </Text>
            </Stack>
            <Stack className={styles.item}>
              <ChoiceGroup
                defaultSelectedKey="local"
                options={uploadOptions}
                label="Upload Protocol YAML"
                required={false}
              />
            </Stack>
            <Stack className={styles.item}>
              <TextField
                label="Job Name"
                value={this.state.jobName}
                onChange={this.setJobName}
                required={true}
              />
            </Stack>
            <Stack className={styles.item}>
              <Toggle
                label="Job Parameters"
                checked={this.state.showParameters}
                onChange={this.toggleParameters}
                inlineLabel={true}
              />
              {this.renderParameters()}
            </Stack>
            <Stack className={styles.item}>
              <Toggle
                label="Protocol YAML Editor"
                checked={this.state.showEditor}
                onChange={this.openEditor}
                inlineLabel={true}
              />
            </Stack>
            <Stack className={styles.footer}>
              <PrimaryButton text="Submit Job" onClick={this.submitProtocol} />
            </Stack>
          </Stack>
        </Stack>
      </Fabric>
    );
  }

  private fetchConfig = () => {
    const source = this.props.source;
    if (source && source.jobName && source.user) {
      fetch(
        `${this.props.api}/api/v1/user/${source.user}/jobs/${source.jobName}/config`,
      ).then((res) => {
        return res.json();
      }).then((body) => {
        const protocol = yaml.parse(body);
        this.setState(
          { protocol },
          () => this.setJobName(
            null as any,
            `${source.jobName}_clone_${Math.random().toString(36).slice(2, 10)}`,
          ),
        );
      }).catch((err) => {
        alert(err.message);
      }).finally(() => {
        this.setState({ loading: false });
      });
    } else {
      this.setState({ loading: false });
    }
  }

  private setJobName = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, jobName?: string) => {
    if (jobName !== undefined) {
      const protocol = update(this.state.protocol, {
        name: { $set: jobName },
      });
      this.setState({
        jobName,
        protocol,
        protocolYAML: yaml.stringify(protocol),
      });
    }
  }

  private importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    const files = event.target.files;
    if (!files || !files[0]) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.addEventListener("load", () => {
      const text = fileReader.result as string;
      try {
        const protocol = yaml.parse(text);
        this.setState({
          jobName: protocol.name || "",
          protocol,
          protocolYAML: text,
        });
      } catch (err) {
        alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  }

  private getParameterItems = () => {
    const pairs: IParameterItem[] = [];
    const parameters = this.state.protocol.parameters as object;
    if (parameters) {
      Object.entries(parameters).forEach(
        ([key, value]) => pairs.push({key, value}),
      );
    }
    return pairs;
  }

  private renderParameterItems = (item?: IParameterItem) => {
    if (item !== undefined) {
      const setParameter = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
        if (value !== undefined) {
          const protocol = this.state.protocol;
          (protocol.parameters as IParameterObj)[item.key] = value;
          this.setState({
            protocol,
            protocolYAML: yaml.stringify(protocol),
          });
        }
      };

      return (
        <TextField
          label={`${item.key}: `}
          defaultValue={item.value}
          onChange={setParameter}
        />
      );
    } else {
      return (null);
    }
  }

  private toggleParameters = (event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) => {
    if (checked !== undefined) {
      this.setState({ showParameters: checked });
    }
  }

  private renderParameters = () => {
    if (this.state.showParameters) {
      const items = this.getParameterItems();
      if (items.length > 0) {
        return (
          <List
            items={this.getParameterItems()}
            onRenderCell={this.renderParameterItems}
          />
        );
      } else {
        return (
          <Label>There is no parameter to show.</Label>
        );
      }
    } else {
      return (null);
    }
  }

  private editProtocol = (text: string) => {
    this.setState({ protocolYAML: text });
  }

  private openEditor = (event: React.MouseEvent<HTMLElement, MouseEvent>, checked?: boolean) => {
    if (checked) {
      this.setState({ showEditor: true });
    }
  }

  private closeEditor = () => {
    this.setState({ showEditor: false });
  }

  private saveEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const text = this.state.protocolYAML;
    try {
      const protocol = yaml.parse(text);
      this.setState({
        jobName: protocol.name || "",
        protocol,
        showEditor: false,
      });
    } catch (err) {
      alert(err.message);
    }
  }

  private discardEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const text = yaml.stringify(this.state.protocol);
    this.setState({
      protocolYAML: text,
      showEditor: false,
    });
  }

  private submitProtocol = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (this.state.protocolYAML == null) {
      return;
    }
    fetch(`${this.props.api}/api/v2/jobs`, {
      body: this.state.protocolYAML,
      headers: {
        "Authorization": `Bearer ${this.props.token}`,
        "Content-Type": "text/yaml",
      },
      method: "POST",
    }).then((res) => {
      return res.json();
    }).then((body) => {
      if (Number(body.status) >= 400) {
        alert(body.message);
      } else {
        window.location.href = `/job-detail.html?username=${this.props.user}&jobName=${this.state.jobName}`;
      }
    }).catch((err) => {
      alert(err.message);
    });
  }
}
