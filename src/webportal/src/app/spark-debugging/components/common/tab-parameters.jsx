import url from 'url';

export class TabParameters {
    constructor(default_tab, default_jobid, default_stageId, default_exeId, default_attemptId) {
        let labels = this.parseHashParameters();
        this.tab = labels['tab'] ? labels['tab'] : default_tab;
        this.jobId = labels['jobid'] ? Number(labels['jobid']) : default_jobid;
        this.stageId = labels['stageid'] ? Number(labels['stageid']) : default_stageId;
        this.exeId = labels['exeid'] ? Number(labels['exeid']) : default_exeId;
        this.attemptID = labels['attemptID'] ? Number(labels['attemptID']) : default_attemptId;
    }

    parseHashParameters() {
        var currentHash = window.location.hash;
        let labels = {};
        var parts = currentHash.toLowerCase().split('#');
        for (var i = 0; i < parts.length; i++) {
            if (parts[i].length > 1) {
                var keyValuePair = parts[i].split('=');
                labels[keyValuePair[0]] = keyValuePair[1];
            }
        }
        return labels;
    }


    static createInstance(tab, jobId, stageId, exeId, attemptID) {
        this.tab = tab;
        this.jobId = jobId;
        this.stageId = stageId;
        this.exeId = exeId;
        this.attemptID = attemptID;
        return this;
    }
}

export class TabParameterHelper {
    static updateHashParameters(tabParam) {
        var newHash = '#tab=' + tabParam.tab +
            '#jobid=' + tabParam.jobId +
            '#stageid=' + tabParam.stageId +
            '#exeid=' + tabParam.exeId +
            '#attemptid=' + tabParam.attemptID;
        if (history.pushState) {
            history.pushState(null, null, newHash);
        }
        else {
            location.hash = newHash;
        }
    }


}