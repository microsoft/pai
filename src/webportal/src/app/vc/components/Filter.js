import querystring from "querystring";

import { getQueue, findQueueAndSubQueue } from "./common/util";
class Filter {
  /**
   * @param {Set<string>?} virtualCluster
   * @param {Set<string>?} subCluster
   * @param {Set<string>?} vcName
   */
  constructor(virtualCluster, subCluster, vcName) {
    this.virtualCluster = virtualCluster;
    this.subCluster = subCluster;
    this.vcName = vcName;
  }

  renderVCSDataOrSVCData(allVirtualClusters, shouldNavigateByCluster) {
    let { virtualCluster, subCluster, vcName } = querystring.parse(
      location.hash
        .split("#")
        .filter((q) => q)
        .join("&")
    );
    if (Number(virtualCluster) !== -1 && Number(subCluster) !== -1) {
      const clusters =
        allVirtualClusters[subCluster] !== undefined
          ? allVirtualClusters[subCluster]
          : allVirtualClusters[virtualCluster];
      const clusterName = Number(vcName) === -1 ? virtualCluster : vcName;
      const queues = shouldNavigateByCluster
        ? getQueue(clusters)
        : clusters[subCluster] || clusters[virtualCluster];
      if (queues) {
        return findQueueAndSubQueue(queues, clusterName);
      }
    }
  }

  /**
   * @param {any[]} jobs
   */
  apply(virtualClusters, shouldNavigateByCluster) {
    const resData = this.renderVCSDataOrSVCData(
      virtualClusters,
      shouldNavigateByCluster
    );
    if (resData != undefined) {
      return resData;
    }
  }
}

export default Filter;
