import {getModified, getStarted, getDuration, getStatusIndex} from './utils';
const LOCAL_STORAGE_KEY = 'jobs-ordering';

export default class Ordering {
  /**
   * @param {"name" | "modified" | "user" | "duration" | "virtualCluster" | "retries" | "status" | "taskCount" | "gpuCount" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending=false) {
    this.field = field;
    this.descending = descending;
  }

  save() {
    const content = JSON.stringify({
      field: this.field,
      descending: this.descending,
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (content) {
        const {field, descending} = JSON.parse(content);
        return new Ordering(field, descending);
      }else {
        return new Ordering();
      }
    } catch (e) {
      new Ordering() && window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  apply(jobs) {
    const {field, descending} = this;
    let comparator;
    if (field == null) {
      return jobs;
    }
    if (field === 'name') {
      comparator = descending
        ? (a, b) => (String(b.name).localeCompare(a.name))
        : (a, b) => (String(a.name).localeCompare(b.name));
    } else if (field === 'modified') {
      comparator = descending
        ? (a, b) => getModified(b) - getModified(a)
        : (a, b) => getModified(a) - getModified(b);
    } else if (field === 'started') {
      comparator = descending
          ? (a, b) => getStarted(b) - getStarted(a)
          : (a, b) => getStarted(a) - getStarted(b);
    } else if (field === 'finished') {
      comparator = descending
          ? (a, b) => b.completedTime - a.completedTime
          : (a, b) => a.completedTime - b.completedTime;
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
    } else if (field === 'allocatedMB') {
      comparator = descending
          ? (a, b) => b.allocatedMB - a.allocatedMB
          : (a, b) => a.allocatedMB - b.allocatedMB;
    } else if (field === 'allocatedVCores') {
      comparator = descending
          ? (a, b) => b.allocatedVCores - a.allocatedVCores
          : (a, b) => a.allocatedVCores - b.allocatedVCores;
    } else if (field === 'priority') {
      comparator = descending
          ? (a, b) => b.priority - a.priority
          : (a, b) => a.priority - b.priority;
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
    } else if (field === 'appProgress') {
      comparator = descending
        ? (a, b) => (b.applicationProgress ? b.applicationProgress.replace(/%/g, '') : 0) - (a.applicationProgress ? a.applicationProgress.replace(/%/g, '') : 0)
        : (a, b) => (a.applicationProgress ? a.applicationProgress.replace(/%/g, '') : 0) - (b.applicationProgress ? b.applicationProgress.replace(/%/g, '') : 0);
    } else if (field === 'jobType') {
      comparator = descending
        ? (a, b) => String(b.jobType).localeCompare(a.jobType)
        : (a, b) => String(a.jobType).localeCompare(b.jobType);
    } else if (field === 'groupId') {
      comparator = descending
        ? (a, b) => (String(b.groupId).localeCompare(a.groupId))
        : (a, b) => (String(a.groupId).localeCompare(b.groupId));
    }
    return jobs.slice().sort(comparator);
  }
}
