import { getModified, getDuration, getStatusIndex } from './utils';

export default class Ordering {
  /**
   * @param {"name" | "modified" | "user" | "duration" | "virtualCluster" | "retries" | "status" | "taskCount" | "gpuCount" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending = false) {
    this.field = field;
    this.descending = descending;
  }

  apply(jobs) {
    const { field, descending } = this;
    let comparator;
    if (field == null) {
      return jobs;
    }
    if (field === 'name') {
      comparator = descending
        ? (a, b) => String(b.name).localeCompare(a.name)
        : (a, b) => String(a.name).localeCompare(b.name);
    } else if (field === 'modified') {
      comparator = descending
        ? (a, b) => getModified(b) - getModified(a)
        : (a, b) => getModified(a) - getModified(b);
    } else if (field === 'user') {
      comparator = descending
        ? (a, b) => String(b.username).localeCompare(a.username)
        : (a, b) => String(a.username).localeCompare(b.username);
    } else if (field === 'duration') {
      comparator = descending
        ? (a, b) => getDuration(b) - getDuration(a)
        : (a, b) => getDuration(a) - getDuration(b);
    } else if (field === 'virtualCluster') {
      comparator = descending
        ? (a, b) => String(b.virtualCluster).localeCompare(a.virtualCluster)
        : (a, b) => String(a.virtualCluster).localeCompare(b.virtualCluster);
    } else if (field === 'retries') {
      comparator = descending
        ? (a, b) => b.retries - a.retries
        : (a, b) => a.retries - b.retries;
    } else if (field === 'status') {
      comparator = descending
        ? (a, b) => getStatusIndex(b) - getStatusIndex(a)
        : (a, b) => getStatusIndex(a) - getStatusIndex(b);
    } else if (field === 'taskCount') {
      comparator = descending
        ? (a, b) => b.totalTaskNumber - a.totalTaskNumber
        : (a, b) => a.totalTaskNumber - b.totalTaskNumber;
    } else if (field === 'gpuCount') {
      comparator = descending
        ? (a, b) => b.totalGpuNumber - a.totalGpuNumber
        : (a, b) => a.totalGpuNumber - b.totalGpuNumber;
    }
    return jobs.slice().sort(comparator);
  }
}
