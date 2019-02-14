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

import TextInput from "../../Components/FormControls/TextInput";

import SimpleJobContext from "../Context";

const EnvironmentVariables: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      const variables = simpleJob.environmentVariables;
      const setVariables = setSimpleJob("environmentVariables");

      const setVariableName = (index: number) => (name: string) => {
        setVariables([
          ...variables.slice(0, index),
          { name, value: variables[index].value },
          ...variables.slice(index + 1),
        ]);
      };
      const setVariableValue = (index: number) => (value: string) => {
        setVariables([
          ...variables.slice(0, index),
          { name: variables[index].name, value },
          ...variables.slice(index + 1),
        ]);
      };

      const addVariable = () => {
        setVariables(variables.concat({ name: "", value: "" }));
      };

      return (
        <React.Fragment>
          <div className="rows">
            {
              simpleJob.environmentVariables.map((variable, index) => (
                <React.Fragment key={index}>
                  <TextInput
                    type="text"
                    className="col-sm-6"
                    value={variable.name}
                    onChange={setVariableName(index)}
                  >
                    Name of the Environment Variable
                  </TextInput>
                  <TextInput
                    type="text"
                    className="col-sm-6"
                    value={variable.value}
                    onChange={setVariableValue(index)}
                  >
                    Value of the Environment Variable
                  </TextInput>
                </React.Fragment>
              ) )
            }
            <div className="col-sm-12">
              <button type="button" className="btn btn-info" onClick={addVariable}>
                <span className="glyphicon glyphicon-plus"/>
                {" Add Environment Variable"}
              </button>
            </div>
          </div>
        </React.Fragment>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default EnvironmentVariables;
