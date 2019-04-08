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

import React from "react";
import { initializeIcons } from "office-ui-fabric-react/lib/Icons";
import { Fabric } from "office-ui-fabric-react/lib/Fabric";
import { Label } from "office-ui-fabric-react/lib/Label";
import { TextField } from "office-ui-fabric-react/lib/TextField";
import { Panel, PanelType } from "office-ui-fabric-react/lib/Panel";
import { Spinner, SpinnerSize } from "office-ui-fabric-react/lib/Spinner";
import { DefaultButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import crypto from "crypto";
import update from "immutability-helper";
import jsyaml from "js-yaml";
import MonacoEditor from "react-monaco-editor";

import bootstrapStyles from "bootstrap/dist/css/bootstrap.css";
import monacoStyles from "./monaco.scss";

initializeIcons();

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
  protocol: {[key: string]: string | object};
  protocolYAML: string;
  loading: boolean;
  showEditor: boolean;
}

export default class ProtocolForm extends React.Component<IProtocolProps, IProtocolState> {
  constructor(props: IProtocolProps) {
    super(props);

    this.state = {
      jobName: "",
      protocol: Object.create(null),
      protocolYAML: "",
      loading: true,
      showEditor: false,
    };
  }

  public componentDidMount() {
    this.fetchConfig();
  }

  public render() {
    if (this.state.loading) {
      return (
        <>
          <Fabric>
            <div className={bootstrapStyles["container"]}>
              <div className={bootstrapStyles["modal-dialog"]}>
                <div className={bootstrapStyles["modal-content"]}>
                  <div className={bootstrapStyles["modal-header"]}>
                    <h3 className={bootstrapStyles["modal-title"]}>
                      Submit Protocol <small>PREVIEW</small>
                    </h3>
                  </div>
                  <div className={`${bootstrapStyles["modal-body"]} ${bootstrapStyles["row"]}`}>
                    <Spinner size={SpinnerSize.large} />
                  </div>
                </div>
              </div>
            </div>
          </Fabric>
        </>
      );
    }
    return (
      <>
        <Fabric>

          <Panel
            isOpen={this.state.showEditor}
            isLightDismiss={true}
            onDismiss={this.closeEditor}
            type={PanelType.largeFixed}
            headerText="Protocol YAML Editor"
          >
            <div className={monacoStyles.monacoHack}>
              <MonacoEditor
                width={800}
                height={800}
                value={this.state.protocolYAML}
                onChange={this.editProtocol}
                language="yaml"
                theme="vs-dark"
                options={{ wordWrap: "on", readOnly: false }}
              />
            </div>
            <div style={{ marginTop: "15px" }}>
              <PrimaryButton text="Save" onClick={this.saveEditor} style={{ marginRight: "10px" }}/>
              <DefaultButton text="Discard" onClick={this.discardEditor} />
            </div>
          </Panel>

          <div className={bootstrapStyles["container"]}>
            <div className={bootstrapStyles["modal-dialog"]}>
              <div className={bootstrapStyles["modal-content"]}>
                <div className={bootstrapStyles["modal-header"]}>
                  <h3 className={bootstrapStyles["modal-title"]}>
                    Submit Protocol <small>PREVIEW</small>
                  </h3>
                </div>
                <div className={`${bootstrapStyles["modal-body"]} ${bootstrapStyles["row"]}`}>
                  <div className={`${bootstrapStyles["form-group"]} ${bootstrapStyles["col-md-8"]}`}>
                    <TextField
                      label="Job Name "
                      value={this.state.jobName}
                      onChanged={this.setJobName}
                      required={true}
                    />
                  </div>
                  <div className={`${bootstrapStyles["form-group"]} ${bootstrapStyles["col-md-8"]}`}>
                    <Label>Protocol YAML Operation</Label>
                      <label className={bootstrapStyles["col-md-3"]} style={{padding: 0}}>
                        <a className={`${bootstrapStyles["btn"]} ${bootstrapStyles["btn-success"]}`}>Import</a>
                        <input
                          type="file"
                          className={bootstrapStyles["sr-only"]}
                          accept=".yml,.yaml"
                          onChange={this.importFile}
                        />
                      </label>
                      <DefaultButton text="View/Edit" onClick={this.openEditor} />
                  </div>
                </div>
                <div className={bootstrapStyles["modal-footer"]} style={{ marginTop: "150px" }}>
                  <PrimaryButton text="Submit Job" onClick={this.submitProtocol} />
                </div>
              </div>
            </div>
          </div>

        </Fabric>
      </>
    );
  }

  private fetchConfig = () => {
    const source = this.props.source;
    if (source && source.jobName && source.user) {
      window.fetch(
        `${this.props.api}/api/v1/user/${source.user}/jobs/${source.jobName}/config`,
      ).then((res) => {
        return res.json();
      }).then((body) => {
        const protocol = jsyaml.safeLoad(body);
        this.setState(
          { protocol },
          () => this.setJobName(
            `${source.jobName}_clone_${crypto.randomBytes(4).toString("hex")}`,
          ),
        );
      }).catch((err) => {
        window.alert(err.message);
      }).finally(() => {
        this.setState({ loading: false });
      });
    } else {
      this.setState({ loading: false });
    }
  }

  private setJobName = (jobName: string) => {
    const protocol = update(this.state.protocol, {
      name: { $set: jobName },
    });
    this.setState({
      jobName,
      protocol,
      protocolYAML: jsyaml.safeDump(protocol),
    });
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
        const protocol = jsyaml.safeLoad(text);
        this.setState({
          jobName: protocol.name || "",
          protocol,
          protocolYAML: text,
        });
      } catch (err) {
        window.alert(err.message);
      }
    });
    fileReader.readAsText(files[0]);
  }

  private editProtocol = (text: string) => {
    this.setState({ protocolYAML: text });
  }

  private openEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    this.setState({ showEditor: true });
  }

  private closeEditor = () => {
    this.setState({ showEditor: false });
  }

  private saveEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const text = this.state.protocolYAML;
    try {
      const protocol = jsyaml.safeLoad(text);
      this.setState({
        jobName: protocol.name || "",
        protocol,
        showEditor: false,
      });
    } catch (err) {
      window.alert(err.message);
    }
  }

  private discardEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const text = jsyaml.safeDump(this.state.protocol);
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
    window.fetch(`${this.props.api}/api/v2/jobs`, {
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
        window.alert(body.message);
      } else {
        window.location.href = `/job-detail.html?username=${this.props.user}&jobName=${this.state.jobName}`;
      }
    }).catch((err) => {
      window.alert(err.message);
    });
  }
}
