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
          <CheckBox className="col-sm-12"
            value={simpleJob.isPrivileged} onChange={setSimpleJob("isPrivileged")}>
            Launch privileged docker
          </CheckBox>
          { simpleJob.isPrivileged ? (
            <>
              <CheckBox className="col-sm-4">Use Host network in container?</CheckBox>
              <CheckBox className="col-sm-4">Use Host IPC in container?</CheckBox>
              <Select className="col-sm-4" options={["Default", "ClusterFirstWithHostNet", "ClusterFirst"]}>
                Container DNS Policy
              </Select>
              <NumberInput className="col-sm-6" value={simpleJob.cpus}
                onChange={setSimpleJob("cpus")}>
                CPU Request
              </NumberInput>
              <NumberInput className="col-sm-6" value={simpleJob.memory}
                onChange={setSimpleJob("memory")}>
                Memory Request
              </NumberInput>
            </>
          ) : null }
        </>
      );
    } }
  </SimpleJobContext.Consumer>
);

export default PriviledgedDocker;
