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
                  <TextInput type="text" className="col-sm-6"
                    value={variable.name} onChange={setVariableName(index)}>
                    Name of the Environment Variable
                  </TextInput>
                  <TextInput type="text" className="col-sm-6"
                    value={variable.value} onChange={setVariableValue(index)}>
                    Value of the Environment Variable
                  </TextInput>
                </React.Fragment>
              ) )
            }
            <div className="col-sm-12">
              <button type="button" className="btn btn-info" onClick={addVariable}>
                <span className="glyphicon glyphicon-plus"></span>
                {" Add Environment Variable"}
              </button>
            </div>
          </div>
        </React.Fragment>
      );
    } }
  </SimpleJobContext.Consumer>
);

export default EnvironmentVariables;
