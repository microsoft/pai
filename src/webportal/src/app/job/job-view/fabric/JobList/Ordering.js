export default class Ordering {
  /**
   * @param {"name" | "modified" | "user" | "duration" | "virtualCluster" | "retries" | "status" | "taskCount" | "gpuCount" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending = false) {
    this.field = field;
    this.descending = descending;
  }

  apply() {
    const { field, descending } = this;
    if (field == null) {
      return undefined;
    }

    let query;
    if (field === 'name') {
      query = 'jobName';
    } else if (field === 'submissionTime') {
      query = 'submissionTime';
    } else if (field === 'user') {
      query = 'username';
    } else if (field === 'virtualCluster') {
      query = 'vc';
    } else if (field === 'retries') {
      query = 'retries';
    } else if (field === 'status') {
      query = 'state';
    } else if (field === 'taskCount') {
      query = 'totalTaskNumber';
    } else if (field === 'gpuCount') {
      query = 'totalGpuNumber';
    }
    return { order: `${query},${descending ? 'DESC' : 'ASC'}` };
  }
}
