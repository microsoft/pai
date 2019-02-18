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

import NumberInput from "../../Components//FormControls/NumberInput";
import TextInput from "../../Components//FormControls/TextInput";

import SimpleJobContext from "../Context";

const HyperParameter: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      return (
        <div className="col-sm-12">
          <TextInput
            value={simpleJob.hyperParameterName}
            onChange={setSimpleJob("hyperParameterName")}
          >
            HyperParameter Name
          </TextInput>
          <NumberInput
            value={simpleJob.hyperParameterStartValue}
            onChange={setSimpleJob("hyperParameterStartValue")}
          >
            Start Value
          </NumberInput>
          <NumberInput
            value={simpleJob.hyperParameterEndValue}
            onChange={setSimpleJob("hyperParameterEndValue")}
          >
            End Value
          </NumberInput>
          <NumberInput
            value={simpleJob.hyperParameterStep}
            onChange={setSimpleJob("hyperParameterStep")}
          >
            Step
          </NumberInput>
        </div>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default HyperParameter;
