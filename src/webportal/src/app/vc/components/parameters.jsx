
export class Parameters {
  constructor(default_virtualCluster, default_cluster, default_vCname, default_navigateByCluster) {
    let labels = this.parseHashParameters();
    this.virtualCluster = default_virtualCluster
      ? default_virtualCluster
      : labels["virtualCluster"] && labels["virtualCluster"] != "undefined"
      ? labels["virtualCluster"]
      : -1;
    this.subCluster = default_cluster
      ? default_cluster
      : labels["subCluster"] && labels["subCluster"] != "undefined"
      ? labels["subCluster"]
      : -1;
    this.vcName = default_vCname
      ? default_vCname
      : labels["vcName"] && labels["vcName"] != "undefined"
      ? labels["vcName"]
      : -1;
    this.navigateByCluster = default_navigateByCluster !== ""  &&  JSON.stringify(default_navigateByCluster)
      ? default_navigateByCluster
      : labels["navigateByCluster"] && labels["navigateByCluster"] != "undefined"
      ? labels["navigateByCluster"]
      : false;
  }

  parseHashParameters() {
    var currentHash = window.location.hash;
    let labels = {};
    var parts = currentHash.split("#");
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length > 1) {
        var keyValuePair = parts[i].split("=");
        labels[keyValuePair[0]] = keyValuePair[1];
      }
    }
    return labels;
  }
}

export class TabParameterHelper {
  static updateHashParameters(tabParam) {
    var newHash =
      "#virtualCluster=" +
      tabParam.virtualCluster +
      "#subCluster=" +
      tabParam.subCluster +
      "#vcName=" +
      tabParam.vcName +
      "#navigateByCluster=" +
      tabParam.navigateByCluster;
    if (history.pushState) {
      history.pushState(null, null, newHash);
    } else {
      location.hash = newHash;
    }
  }
}
