import React, { useState, useEffect, useContext } from "react";
import c from "classnames";
import $ from "jquery";
import t from "tachyons-sass/tachyons.scss";
import { isEmpty } from "lodash";
import { VirtualClusterContext } from "../../Context";
import Overview from "./Overview";
import ActiveUser from "./ActiveUsers";
import Partition from "./Partition";
import {
  DefaultPalette,
  Stack,
  IStackStyles,
  IStackTokens,
  IStackItemStyles,
} from "office-ui-fabric-react";

function Table({ setSubData }) {
  const {
    allVirtualClusters,
    parameters,
    filter,
    shouldNavigateByCluster,
    ordering,
    setOrderingCb,
  } = useContext(VirtualClusterContext);

  const [vcData, setVcData] = useState();
  const [user, setUser] = useState(null);
  const [totalResourcesConfigured, setTotalResourcesConfigured] = useState(0);
  const [totalResourcesAllocated, setTotalResourcesAllocated] = useState(0);

  let prevWidth = 0;
  function layout(e) {
    const width = $(
      "#content-wrapper .virtual-cluster #vc-content-table-overview .table"
    ).width();
    if (prevWidth === width) return;
    $(
      "#content-wrapper .virtual-cluster #vc-content-table-activeusers .table"
    ).css({ minWidth: width });
    $(
      "#content-wrapper .virtual-cluster #vc-content-table-partitions  .table"
    ).css({ minWidth: width });
    prevWidth = width;
  }

  window.addEventListener("resize", layout);

  useEffect(() => {
    layout();
  }, []);

  useEffect(() => {
    try {
      const queues = filter.apply(allVirtualClusters, shouldNavigateByCluster);
      if (!isEmpty(queues)) {
        const [queue, subQueue] = queues;
        if (!isEmpty(queue) && !isEmpty(subQueue)) {
          if (!isEmpty(queue["users"])) {
            setUser(queue["users"]);
          } else {
            // clear data
            setUser();
          }
          setSubData(subQueue);
          setVcData(queue);
        }
      }
    } catch (error) {
      console.log(error);
    }
  }, [allVirtualClusters, filter]);

  return !vcData || vcData === undefined ? (
    <div></div>
  ) : (
    <Stack className={c("vc-table-container", t.relative)}>
      <Stack.Item>
        <Overview
          vcData={vcData}
          totalResourcesAllocated={totalResourcesAllocated}
          totalResourcesConfigured={totalResourcesConfigured}
        />
      </Stack.Item>
      <Stack.Item>
        <ActiveUser
          user={user}
          vcData={vcData}
          ordering={ordering}
          setOrderingCb={setOrderingCb}
        />
      </Stack.Item>
      <Stack.Item grow={3}>
        <Partition
          totalResourcesConfigured={totalResourcesConfigured}
          setTotalResourcesConfigured={setTotalResourcesConfigured}
          setTotalResourcesAllocated={setTotalResourcesAllocated}
          vcData={vcData}
          parameters={parameters}
        />
      </Stack.Item>
    </Stack>
  );
}

export default Table;
