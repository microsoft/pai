// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const LOCAL_STORAGE_KEY = 'pai-job-ordering';

export default class Ordering {
  /**
   * @param {"name" | "modified" | "user" | "virtualCluster" | "retries" | "status" | "taskCount" | "gpuCount" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending = false) {
    this.field = field;
    this.descending = descending;
  }

  save() {
    if (this.field !== undefined) {
      const content = JSON.stringify({
        field: this.field,
        descending: this.descending,
      });
      window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
    } else {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const { field, descending } = JSON.parse(content);
      if (
        field !== undefined &&
        [
          'name',
          'modified',
          'user',
          'virtualCluster',
          'retries',
          'status',
          'taskCount',
          'gpuCount',
        ].includes(field)
      ) {
        this.field = field;
        if (descending !== undefined) {
          this.descending = descending;
        }
      } else {
        this.field = undefined;
        this.descending = undefined;
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  apply() {
    const { field, descending } = this;
    if (field === undefined) {
      return {};
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
