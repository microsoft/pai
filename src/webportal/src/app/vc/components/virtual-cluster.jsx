import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import { MessageBar, MessageBarType, getTheme } from "office-ui-fabric-react";
import { isEmpty } from "lodash";
import c from "classnames";
import t from "tachyons-sass/tachyons.scss";
import * as querystring from "querystring";
import Cluster from "./";
import { VirtualClusterContext } from "./Context";
import { Parameters, TabParameterHelper } from "./parameters.jsx";
import { SpinnerLoading } from "../../components/loading";
import Filter from "./Filter";
import {
  getUserGrouplist,
  listSchedulerVirtualClusters,
} from "../../home/home/conn";
import {
  getQueue,
  setQueueNames,
  volumeStatistic,
  findQueueAndSubQueue,
  getSubQueue,
} from "./common/util.js";
import { checkUserPermission } from "../../home/home/util";
import Ordering from "../../spark-debugging/components/common/table/Ordering";
import {
  getSubClusters,
  getVirtualClusterScheduler2Subclusters,
} from "../../home/home/util";
const { spacing } = getTheme();

function VirtualCluster() {
  const [allVirtualClusters, setAllVcirtualClusters] = useState(null);
  const [virtualCluster2Subclusters, setVirtualCluster2Subclusters] = useState(
    null
  );
  const [userGroups, setUserGroups] = useState(null);
  const [parameters, setParameters] = useState(new Parameters());
  const [filter, setFilter] = useState(new Filter());
  const [loading, setLoading] = useState(true);
  const [volumeStatistics, setVolumeStatistics] = useState([]);
  const [clusterNavList, setClustersNavList] = useState();
  const [selectedIndexs, setSelectedIndexs] = useState([-1, -1]);
  const [shouldNavigateByCluster, setShouldNavigateByCluster] = useState(false);
  const [vcname, setVcName] = useState();
  const [prevParameters, setPrevParameters] = useState();
  const [ordering, setOrdering] = useState(new Ordering("", false, true));
  const { virtualCluster, subCluster, vcName, navigateByCluster } = parameters;

  useLayoutEffect(() => {
    if (location.search) {
      location.search = "";
    }
    const { navigatedBySubCluster } = cookies.get();
    if (Number(virtualCluster) === -1) {
      const querys = querystring.parse(location.hash.replace(/^\#/, ""));
      if (querys["vcName"]) {
        setVcName(querys["vcName"]);
      }
    }
    setShouldNavigateByCluster(
      JSON.parse(navigatedBySubCluster || navigateByCluster)
    );
  }, []);

  const setParametersCallback = useCallback(
    (
      virtualCluster = prevParameters.virtualCluster,
      subCluster = prevParameters.subCluster,
      vcName = prevParameters.vcName,
      navigateByCluster = shouldNavigateByCluster
    ) => {
      setParameters(
        new Parameters(virtualCluster, subCluster, vcName, navigateByCluster)
      );
    }
  );

  const setOrderingCb = useCallback((field, descending, stringAscending) => {
    setOrdering(new Ordering(field, descending, stringAscending));
  });

  useEffect(() => {
    setFilter(new Filter(virtualCluster, subCluster, vcName));
    if (parameters === prevParameters) return;
    TabParameterHelper.updateHashParameters(parameters);
    return () => {
      setPrevParameters(parameters);
    };
  }, [parameters]);

  useEffect(() => {
    Promise.all([getUserGrouplist(), listSchedulerVirtualClusters()])
      .then(([userGroupList, virtualClusters]) => {
        if (userGroupList === undefined || virtualClusters === undefined) {
          setLoading(false);
          return;
        }
        setUserGroups(userGroupList);
        setVirtualCluster2Subclusters(virtualClusters);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  const filterCluster2Subclusters = useCallback((subClusters, clusters) => {
    const filterClusters = {};
    subClusters.forEach((sb) => {
      const cluster = clusters[sb];
      if (cluster != undefined) {
        filterClusters[sb] = cluster;
      }
    });
    return filterClusters;
  });

  useEffect(() => {
    if (virtualCluster2Subclusters && !isEmpty(virtualCluster2Subclusters)) {
      setLoading(false);
      const subClusters = getSubClusters();
      if (subClusters) {
        const { virtualClusters } = getVirtualClusterScheduler2Subclusters(
          virtualCluster2Subclusters,
          subClusters
        );
        const filterClusters = filterCluster2Subclusters(
          subClusters,
          virtualCluster2Subclusters["Clusters"]
        );
        shouldNavigateByCluster
          ? setAllVcirtualClusters(filterClusters)
          : setAllVcirtualClusters(virtualClusters);
      }
    }
  }, [virtualCluster2Subclusters, shouldNavigateByCluster]);

  const setParameter = useCallback((virtualCluster, subCluster, vcName) => {
    setParametersCallback(
      virtualCluster,
      subCluster,
      vcName,
      shouldNavigateByCluster
    );
  });

  useEffect(() => {
    try {
      if (allVirtualClusters && !isEmpty(allVirtualClusters)) {
        const { virtualClusterUri, subClusterUri } = cookies.get();
        if (subClusterUri) {
          if (vcname) {
            setVirtualClusterAndVCName(
              allVirtualClusters,
              vcname,
              subClusterUri
            );
            setVcName();
            location.hash = "";
          } else if (virtualClusterUri) {
            const arr = Array.from(JSON.parse(virtualClusterUri));
            if (arr.length > 0) {
              setVirtualClusterAndVCName(
                allVirtualClusters,
                arr[0],
                subClusterUri
              );
            }
          }
        }
      }
    } catch (error) {
      setParameter(-1, -1, -1);
    }
  }, [allVirtualClusters]);

  const setVirtualClusterAndVCName = useCallback(
    (allVirtualClusters, vc, subClusterUri) => {
      let subClusters = shouldNavigateByCluster
        ? getQueue(allVirtualClusters[subClusterUri])
        : getSubQueue(allVirtualClusters, subClusterUri, vc);
      const [queue, subQueue] = findQueueAndSubQueue(subClusters, vc);
      if (subQueue) {
        subQueue["queueName"] && subQueue["queueName"] !== vc
          ? setParameter(subQueue["queueName"], subClusterUri, vc)
          : setParameter(vc, subClusterUri, -1);
      } else {
        setParameter(
          (queue && queue["queueName"]) || virtualCluster,
          subClusterUri,
          -1
        );
      }
    }
  );

  const getItems = useCallback((i, d, isHas) => [i, d, isHas]);

  function setNavItemsAndVolumeStatistics(data) {
    try {
      let item = null;
      let itemList = [];
      let noPermissionCluster = [];
      let permissionCluster = [];
      let noVolumeStatisticList = [];
      let volumeStatisticList = [];
      for (const v in data) {
        if (data.hasOwnProperty(v) && !isEmpty(data[v])) {
          const isHasPermission = checkUserPermission(
            userGroups.username,
            userGroups,
            v,
            data
          );
          item = data[v];
          itemList = shouldNavigateByCluster
            ? setQueueNames(getQueue(data[v]))
            : (itemList = Object.keys(data[v]));
          if (isHasPermission) {
            volumeStatisticList.push(
              volumeStatistic(item, !shouldNavigateByCluster, v)
            );
            permissionCluster.push(getItems(v, itemList, isHasPermission));
          } else {
            noVolumeStatisticList.push(
              volumeStatistic(item, !shouldNavigateByCluster, v)
            );
            noPermissionCluster.push(getItems(v, itemList, isHasPermission));
          }
        }
      }
      setVolumeStatistics(volumeStatisticList.concat(noVolumeStatisticList));
      setClustersNavList(permissionCluster.concat(noPermissionCluster));
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (allVirtualClusters) {
      setNavItemsAndVolumeStatistics(allVirtualClusters);
    }
  }, [allVirtualClusters]);

  const context = {
    allVirtualClusters,
    userGroups,
    prevParameters,
    parameters,
    setParametersCallback,
    Parameters,
    setShouldNavigateByCluster,
    shouldNavigateByCluster,
    filter,
    setFilter,
    Filter,
    clusterNavList,
    volumeStatistics,
    ordering,
    setOrderingCb,
  };

  return (
    <VirtualClusterContext.Provider value={context}>
      {loading ? (
        <SpinnerLoading />
      ) : allVirtualClusters && !isEmpty(allVirtualClusters) ? (
        <Cluster />
      ) : (
        <div style={{ padding: spacing.l1 }}>
          <MessageBar messageBarType={MessageBarType.error}>
            Failed to fetch virtual clusters data
          </MessageBar>
        </div>
      )}
    </VirtualClusterContext.Provider>
  );
}

export default VirtualCluster;
