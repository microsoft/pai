const yaml = require('js-yaml');
const fs = require('fs');
const base32 = require('base32');

const podsStr = fs.readFileSync('pods.json');
const res = JSON.parse(podsStr).items;

// console.log(JSON.stringify(pods, null, 4));

const pods = Array.from(res, (pod) => {
  const podInfo = {
    jobName: null,
    virtualCluster: null,
    taskRoleName: null,
    taskIndex: null,
    resource: {
      cpu: null,
      memory: null,
      gpu: null,
    }

  };
  const annotations = pod.metadata.annotations;
  const labels = pod.metadata.labels;
  podInfo.jobName = base32.decode(annotations);
  const schedulerSpec = annotations['hivedscheduler.microsoft.com/pod-scheduling-spec'];
  if (schedulerSpec == null) {
    // TODO: not a hived job
  }
  const bindingInfo = annotations['hivedscheduler.microsoft.com/pod-bind-info'];
  return {
    schedulerSpec: schedulerSpec,
    bindingInfo: bindingInfo,
  }
});

console.log(pods);