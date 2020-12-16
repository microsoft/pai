import url from "url";

export class TabParameters {
  constructor(
    default_tab,
    default_batchTimeId,
    default_jobid,
    default_stageId,
    default_attemptId
  ) {
    let labels = this.parseHashParameters();
    this.tab = labels["tab"] ? labels["tab"] : default_tab;
    this.batchTimeId =
      labels["batchtimeid"] && labels["batchtimeid"] != "undefined"
        ? Number(labels["batchtimeid"])
        : default_batchTimeId;
    this.jobId =
      labels["jobid"] && labels["jobid"] != "undefined"
        ? Number(labels["jobid"])
        : default_jobid;
    this.stageId =
      labels["stageid"] && labels["stageid"] != "undefined"
        ? Number(labels["stageid"])
        : default_stageId;
    this.attemptID = labels["attemptID"]
      ? Number(labels["attemptID"])
      : default_attemptId;
  }

  parseHashParameters() {
    var currentHash = window.location.hash;
    let labels = {};
    var parts = currentHash.toLowerCase().split("#");
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].length > 1) {
        var keyValuePair = parts[i].split("=");
        labels[keyValuePair[0]] = keyValuePair[1];
      }
    }
    return labels;
  }

  // static createInstance(tab, jobId, stageId, exeId) {
  //     this.tab = tab;
  //     this.jobId = jobId;
  //     this.stageId = stageId;
  //     this.exeId = exeId;
  //     return this;
  // }
}

export class TabParameterHelper {
  static updateHashParameters(tabParam) {
    if (tabParam.tab.search("batchleveldebug") >= 0) {
      var newHash =
        "#tab=" +
        tabParam.tab +
        "#batchtimeid=" +
        tabParam.batchTimeId +
        "#jobid=" +
        tabParam.jobId +
        "#stageid=" +
        tabParam.stageId +
        '#attemptid=' + tabParam.attemptID;
    } else {
      var newHash = "#tab=" + tabParam.tab;
    }

    // +
    // "#exeid=" +
    // tabParam.exeId;
    if (history.pushState) {
      history.pushState(null, null, newHash);
    } else {
      location.hash = newHash;
    }
  }
}
