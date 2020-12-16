import React, {
  useContext,
  useCallback,
  useState,
  useEffect,
  useMemo,
} from "react";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";

import { VirtualClusterContext } from "../../Context";
import {
  renderCombobox,
  renderComboboxItems,
} from "../../common/renderComponent";

function queueCombobox({ subData }) {
  const { parameters, setParametersCallback, Filter, setFilter } = useContext(
    VirtualClusterContext
  );
  const [vcComboboxItems, setVcComboboxItems] = useState([]);

  const onVcNameComboBoxCallback = useCallback((e, item) => {
    if (item) {
      setVcComboboxItemsCb(item.text);
    }
  });

  useEffect(() => {
    const { vcName } = parameters;
    if (setQueueNameList) {
      if (Number(vcName) === -1) {
        setVcComboboxItemsCb(setQueueNameList[0]);
      } else {
        if (setQueueNameList.includes(vcName)) {
          setVcComboboxItemsCb(vcName);
        } else {
          setVcComboboxItemsCb(setQueueNameList[0]);
        }
      }
    } else {
      // Clear the previous options
      setVcComboboxItems([]);
    }
  }, [subData]);

  const setVcComboboxItemsCb = useCallback((vcName) => {
    const { virtualCluster, subCluster } = parameters;
    setFilter(new Filter(virtualCluster, subCluster, vcName));
    setParametersCallback(virtualCluster, subCluster, vcName);

    setVcComboboxItems(
      renderComboboxItems(setQueueNameList, onVcNameComboBoxCallback, vcName)
    );
  });

  const setQueueNameList = useMemo(() => {
    if (subData) {
      let queueNames = [subData["queueName"]];
      if (queueNames != "undefined") {
        const queues = subData["queues"];
        if (queues && queues != "undefined") {
          if (queues["queue"].length > 0) {
            queueNames.push(...queues["queue"].map((queue) => queue.queueName));
            return queueNames;
          }
        }
      }
    }
  }, [subData]);

  return (
    <div className="vcname-comboBox">
      {setQueueNameList === undefined ? <div className={c(t.h2)}></div> : renderCombobox("vcName", vcComboboxItems)}
    </div>
  );
}

export default queueCombobox;
