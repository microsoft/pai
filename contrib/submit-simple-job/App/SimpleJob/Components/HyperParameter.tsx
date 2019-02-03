import * as React from "react";

import NumberInput from "../../Components//FormControls/NumberInput";
import TextInput from "../../Components//FormControls/TextInput";

import SimpleJobContext from "../Context";

const HyperParameter: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      return (
        <div className="col-sm-12">
          <TextInput value={simpleJob.hyperParameterName}
            onChange={setSimpleJob("hyperParameterName")}>
            HyperParameter Name
          </TextInput>
          <NumberInput value={simpleJob.hyperParameterStartValue}
            onChange={setSimpleJob("hyperParameterStartValue")}>
            Start Value
          </NumberInput>
          <NumberInput value={simpleJob.hyperParameterEndValue}
            onChange={setSimpleJob("hyperParameterEndValue")}>
            End Value
          </NumberInput>
          <NumberInput value={simpleJob.hyperParameterStep}
            onChange={setSimpleJob("hyperParameterStep")}>
            Step
          </NumberInput>
        </div>
      );
    } }
  </SimpleJobContext.Consumer>
);

export default HyperParameter;
