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
import { DefaultButton, PrimaryButton } from "office-ui-fabric-react/lib/Button";
import MonacoEditor from "react-monaco-editor";
import jsyaml from "js-yaml";

interface IProtocolProps {
  api: string;
  user: string;
  token: string;
}

interface IProtocolState {
  jobName: string;
  protocol: {[key: string]: string | object};
  protocolYAML: string;
  showEditor: boolean;
}

export default class ProtocolForm extends React.Component<IProtocolProps, IProtocolState> {
  constructor(props: IProtocolProps) {
    super(props);
    initializeIcons();
    this.state = {
      jobName: "",
      protocol: Object.create(null),
      protocolYAML: "",
      showEditor: false,
    };
  }

  public render() {
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
            <MonacoEditor
              width={800}
              height={800}
              value={this.state.protocolYAML}
              onChange={this.editProtocol}
              language="yaml"
              theme="vs-dark"
              options={{ wordWrap: "on", readOnly: false }}
            />
            <div style={{ marginTop: "15px" }}>
              <PrimaryButton text="Save" onClick={this.saveEditor} style={{ marginRight: "10px" }}/>
              <DefaultButton text="Discard" onClick={this.discardEditor} />
            </div>
          </Panel>
          <div className="content">
            <form className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="Header">
                    Submit Protocol <small style={{ margin: "10px" }}>PREVIEW</small>
                  </h3>
                </div>
                <div className="modal-body row">
                  <div className="form-group col-md-8">
                    <TextField
                      label="Job Name "
                      value={this.state.jobName}
                      onChanged={this.setJobName}
                      required={true}
                    />
                  </div>
                  <div className="form-group col-md-8">
                    <Label>Protocol YAML Operation</Label>
                      <label className="col-md-3" style={{padding: 0}}>
                        <a type="button" className="btn btn-default">Import</a>
                        <input
                          type="file"
                          className="sr-only"
                          accept=".yml,.yaml"
                          onChange={this.importFile}
                        />
                      </label>
                      <DefaultButton text="View/Edit" onClick={this.openEditor} />
                  </div>
                </div>
                <div className="modal-footer" style={{ marginTop: "256px" }}>
                  <PrimaryButton text="Submit Job" onClick={this.submitProtocol} />
                </div>
              </div>
            </form>
          </div>
        </Fabric>
      </>
    );
  }

  private setJobName = (jobName: string) => {
    const protocol = this.state.protocol;
    protocol.name = jobName;
    this.setState({ jobName });
    this.setState({ protocol });
    this.setState({ protocolYAML: jsyaml.safeDump(protocol) });
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
        this.setState({ jobName: protocol.name || "" });
        this.setState({ protocol });
        this.setState({ protocolYAML: text });
      } catch (err) {
        alert(err.message);
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
      this.setState({ jobName: protocol.name || "" });
      this.setState({ protocol });
      this.setState({ showEditor: false });
    } catch (err) {
      alert(err.message);
    }
  }

  private discardEditor = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    const protocol = this.state.protocol;
    this.setState({ protocolYAML: jsyaml.safeDump(protocol) });
    this.setState({ showEditor: false });
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
      if (parseInt(body.status) >= 400) {
        window.alert(body.message);
      } else {
        window.location.href = `/job-detail.html?username=${this.props.user}&jobName=${this.state.jobName}`;
      }
    }).catch((error) => {
      window.alert(error.message);
    });
  }
}
