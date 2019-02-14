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
import TextInput from "../../Components/FormControls/TextInput";

import SimpleJobContext from "../Context";

const centerdTableDataStyle: React.CSSProperties = {
  textAlign: "center",
  verticalAlign: "middle",
};

const MountDirectories: React.FunctionComponent = () => (
  <SimpleJobContext.Consumer>
    { ({ value: simpleJob, set: setSimpleJob }) => {
      return (
        <table className="table col-sm-12" style={{ marginBottom: 0 }}>
          <thead className="active">
            <tr>
              <th>Path inside container</th>
              <th>Path on host machine (or storage server)</th>
              <th>Enable</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody className="text-center" style={{ verticalAlign: "middle" }}>
            <tr>
              <td style={centerdTableDataStyle}><code>/work</code></td>
              <td style={centerdTableDataStyle}>
                <TextInput
                  value={simpleJob.workPath}
                  onChange={setSimpleJob("workPath")}
                >
                  Work Path
                </TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox
                  value={simpleJob.enableWorkMount}
                  onChange={setSimpleJob("enableWorkMount")}
                />
              </td>
              <td style={centerdTableDataStyle}/>
            </tr>
            <tr>
              <td style={centerdTableDataStyle}><code>/data</code></td>
              <td style={centerdTableDataStyle}>
                <TextInput
                  value={simpleJob.dataPath}
                  onChange={setSimpleJob("dataPath")}
                >
                  Data Path
                </TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox
                  value={simpleJob.enableDataMount}
                  onChange={setSimpleJob("enableDataMount")}
                />
              </td>
              <td style={centerdTableDataStyle}/>
            </tr>
            <tr>
              <td style={centerdTableDataStyle}><code>/job</code></td>
              <td style={centerdTableDataStyle}>
                <TextInput
                  value={simpleJob.jobPath}
                  onChange={setSimpleJob("jobPath")}
                >
                  Job Path
                </TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox
                  value={simpleJob.enableJobMount}
                  onChange={setSimpleJob("enableJobMount")}
                />
              </td>
              <td style={centerdTableDataStyle}/>
            </tr>
          </tbody>
        </table>
      );
    }}
  </SimpleJobContext.Consumer>
);

export default MountDirectories;
