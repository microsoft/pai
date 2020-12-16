import {getStatusText} from './utils';

const LOCAL_STORAGE_KEY = 'pai-job-filter';

class Filter {
  /**
   * @param {Set<string>?} users
   * @param {Set<string>?} virtualClusters
   * @param {Set<string>?} statuses
   * @param {Set<string>?} jobType
   */
  constructor(
    keyword = '',
    users = new Set(),
    virtualClusters = new Set(),
    statuses = new Set(),
    jobType = new Set(),
  ) {
    this.keyword = keyword;
    this.users = users;
    this.virtualClusters = virtualClusters;
    this.statuses = statuses;
    this.jobType = jobType;

    this._cachedJob = null;
  }

  save() {
    const content = JSON.stringify({
      keyword: this.keyword,
      users: Array.from(this.users),
      virtualClusters: Array.from(this.virtualClusters),
      statuses: Array.from(this.statuses),
      jobType: Array.from(this.jobType),
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const {keyword, users, virtualClusters, statuses, jobType} = JSON.parse(content);
      if (keyword !== undefined && keyword) {
        this.keyword = keyword;
      }
      if (Array.isArray(users)) {
        this.users = new Set(users);
      }
      if (Array.isArray(virtualClusters)) {
        this.virtualClusters = new Set(virtualClusters);
      }
      if (Array.isArray(statuses)) {
        this.statuses = new Set(statuses);
      }
      if (Array.isArray(jobType)) {
        this.jobType = new Set(jobType);
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  /**
   * @param {any[]} jobs
   */
  apply(jobs) {
    const {keyword, users, virtualClusters, statuses, jobType} = this;
    const filters = [];
    if (keyword !== '') {
      filters.push(({
        name,
        username,
        virtualCluster,
        appId,
        groupId,
      }) => (
        name.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        username.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        virtualCluster.toLowerCase().indexOf(keyword.toLowerCase()) > -1 ||
        appId.indexOf(keyword) > -1 ||
        (groupId !== null && groupId.indexOf(keyword) > -1)
      ));
    }
    if (users.size > 0) {
      filters.push(({username}) => users.has(username));
    }
    if (virtualClusters.size > 0) {
      filters.push(({virtualCluster}) => virtualClusters.has(virtualCluster));
    }
    if (statuses.size > 0) {
      filters.push((job) => statuses.has(getStatusText(job)));
    }
    if (jobType.size > 0) {
      filters.push((job) => jobType.has(job.jobType));
    }
    if (filters.length === 0) return jobs;

    return jobs.filter((job) => filters.every((filter) => filter(job)));
  }
}

export default Filter;
