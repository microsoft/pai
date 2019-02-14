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

import CheckBox from "../../Components/FormControls/CheckBox";
import NumberInput from "../../Components/FormControls/NumberInput";
import Select from "../../Components/FormControls/Select";

import SimpleJobContext from "../Context";

const PriviledgedDocker: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      return (
        <>
          <CheckBox
            className="col-sm-12"
            value={simpleJob.isPrivileged}
            onChange={setSimpleJob("isPrivileged")}
          >
            Launch privileged docker
          </CheckBox>
          { simpleJob.isPrivileged ? (
            <>
              <CheckBox className="col-sm-4">Use Host network in container?</CheckBox>
              <CheckBox className="col-sm-4">Use Host IPC in container?</CheckBox>
              <Select className="col-sm-4" options={["Default", "ClusterFirstWithHostNet", "ClusterFirst"]}>
                Container DNS Policy
              </Select>
              <NumberInput
                className="col-sm-6"
                value={simpleJob.cpus}
                onChange={setSimpleJob("cpus")}
              >
                CPU Request
              </NumberInput>
              <NumberInput
                className="col-sm-6"
                value={simpleJob.memory}
                onChange={setSimpleJob("memory")}
              >
                Memory Request
              </NumberInput>
            </>
          ) : null }
        </>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default PriviledgedDocker;
