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
                <TextInput value={simpleJob.workPath}
                  onChange={setSimpleJob("workPath")}>Work Path</TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox value={simpleJob.enableWorkMount}
                  onChange={setSimpleJob("enableWorkMount")}/>
              </td>
              <td style={centerdTableDataStyle}></td>
            </tr>
            <tr>
              <td style={centerdTableDataStyle}><code>/data</code></td>
              <td style={centerdTableDataStyle}>
                <TextInput value={simpleJob.dataPath}
                  onChange={setSimpleJob("dataPath")}>Data Path</TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox value={simpleJob.enableDataMount}
                  onChange={setSimpleJob("enableDataMount")}/>
              </td>
              <td style={centerdTableDataStyle}></td>
            </tr>
            <tr>
              <td style={centerdTableDataStyle}><code>/job</code></td>
              <td style={centerdTableDataStyle}>
                <TextInput value={simpleJob.jobPath}
                  onChange={setSimpleJob("jobPath")}>Job Path</TextInput>
              </td>
              <td style={centerdTableDataStyle}>
                <CheckBox value={simpleJob.enableJobMount}
                  onChange={setSimpleJob("enableJobMount")}/>
              </td>
              <td style={centerdTableDataStyle}></td>
            </tr>
          </tbody>
        </table>
      );
    } }
  </SimpleJobContext.Consumer>
);

export default MountDirectories;
