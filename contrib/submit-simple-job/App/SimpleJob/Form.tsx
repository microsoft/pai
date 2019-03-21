/*!
 * Copyright (c) Microsoft Corporation
 * All rights reserved.
 *
 * MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as React from "react";

import { nfs } from "../../config";

import SimpleJob from ".";
import SimpleJobContext from "./Context";

import CheckBox from "../Components/FormControls/CheckBox";
import NumberInput from "../Components/FormControls/NumberInput";
import Select from "../Components/FormControls/Select";
import TextArea from "../Components/FormControls/TextArea";
import TextInput from "../Components/FormControls/TextInput";
import Panel from "../Components/Panel";

import TemplatesSelect from "../Templates/Select";

import DatabaseOperation from "./Components/DatabaseOperation";
import EnvironmentVariables from "./Components/EnvironmentVariables";
import HyperParameter from "./Components/HyperParameter";
import MountDirectories from "./Components/MountDirectories";
import PriviledgedDocker from "./Components/PriviledgedDocker";

interface IModelFormProps {
  submitLabel: string;
  title: string;
  onSubmit: React.FormEventHandler;
}

const ModelForm: React.FunctionComponent<IModelFormProps> = ({ children, onSubmit, submitLabel, title }) => (
  <form className="modal-dialog" onSubmit={onSubmit}>
    <div className="modal-content">
      <div className="modal-header">
        <h4 className="modal-title">{title}</h4>
      </div>
      <div className="modal-body row">
        {children}
      </div>
      <div className="modal-footer">
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </div>
  </form>
);

interface ISimpleJobFormProps {
  onSubmit: (simpleJob: SimpleJob) => void;
}

const SimpleJobForm: React.FunctionComponent<ISimpleJobFormProps> = ({ onSubmit }) => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      const types = [{ label: "Regular Job", value: "regular" }];
      const onFormSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(simpleJob);
      };
      return (
        <ModelForm title="Submit Job" submitLabel="Submit Job" onSubmit={onFormSubmit}>
          <TemplatesSelect className="col-md-6">
            Job Template
          </TemplatesSelect>
          <div className="clearfix"/>
          <TextInput
            className="col-md-6"
            value={simpleJob.name}
            onChange={setSimpleJob("name")}
          >
            Job Name
          </TextInput>
          <Select className="col-md-6" options={types}>
            Job Type
          </Select>
          <NumberInput
            className="col-md-12"
            value={simpleJob.gpus}
            onChange={setSimpleJob("gpus")}
            min={0}
            max={8}
          >
            Number of GPUs
          </NumberInput>
          <TextInput
            className="col-md-12"
            value={simpleJob.image}
            onChange={setSimpleJob("image")}
          >
            Docker Image
          </TextInput>
          <TextArea
            className="col-md-12"
            rows={10}
            value={simpleJob.command}
            onChange={setSimpleJob("command")}
          >
            Command
          </TextArea>
          <TextInput
            className="col-md-12"
            value={simpleJob.virtualCluster}
            onChange={setSimpleJob("virtualCluster")}
          >
            Virtual Cluster
          </TextInput>
          <CheckBox
            className="col-md-4"
            value={simpleJob.isInteractive}
            onChange={setSimpleJob("isInteractive")}
          >
            Interactive Job
          </CheckBox>
          <CheckBox
            className="col-md-4"
            value={simpleJob.enableTensorboard}
            onChange={setSimpleJob("enableTensorboard")}
          >
            Enable Tensorboard
          </CheckBox>
          <CheckBox
            className="col-md-4"
            value={simpleJob.root}
            onChange={setSimpleJob("root")}
          >
            Launch container as root user.
          </CheckBox>
          {
            simpleJob.isInteractive ? (
              <TextInput
                className="col-md-12"
                value={simpleJob.interactivePorts}
                onChange={setSimpleJob("interactivePorts")}
              >
                Open ports for interactive job
              </TextInput>
            ) : null
          }
          {
            simpleJob.enableTensorboard ? (
              <TextInput
                className="col-md-12"
                value={simpleJob.tensorboardModelPath}
                onChange={setSimpleJob("tensorboardModelPath")}
              >
                Tensorflow model path, used to enable tensorboard
              </TextInput>
            ) : null
          }
          <div className="col-md-12">
            <Panel title="Advanced Options">
              <div className="panel-group col-sm-12">
                {
                  nfs ? (
                    <Panel title="Mount Directories">
                      <MountDirectories/>
                    </Panel>
                  ) : null
                }
                <Panel title="HyperParameter Turning">
                  <HyperParameter/>
                </Panel>
                <Panel title="Environment variables">
                  <EnvironmentVariables/>
                </Panel>
                <Panel title="Priviledged Docker">
                  <PriviledgedDocker/>
                </Panel>
              </div>
            </Panel>
          </div>
          <div className="col-md-12">
            <Panel title="Database operation">
              <DatabaseOperation/>
            </Panel>
          </div>
        </ModelForm>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default SimpleJobForm;
