import { getStatusText } from './utils';

const LOCAL_STORAGE_KEY = 'pai-job-filter';

class Filter {
  /**
   * @param {Set<string>?} users
   * @param {Set<string>?} virtualClusters
   * @param {Set<string>?} statuses
   */
  constructor(
    keyword = '',
    users = new Set(),
    virtualClusters = new Set(),
    statuses = new Set(),
  ) {
    this.keyword = keyword;
    this.users = users;
    this.virtualClusters = virtualClusters;
    this.statuses = statuses;

    this._cachedJob = null;
  }

  save() {
    const content = JSON.stringify({
      users: Array.from(this.users),
      virtualClusters: Array.from(this.virtualClusters),
      statuses: Array.from(this.statuses),
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const { users, virtualClusters, statuses } = JSON.parse(content);
      if (Array.isArray(users)) {
        this.users = new Set(users);
      }
      if (Array.isArray(virtualClusters)) {
        this.virtualClusters = new Set(virtualClusters);
      }
      if (Array.isArray(statuses)) {
        this.statuses = new Set(statuses);
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  /**
   * @param {any[]} jobs
   */
  apply(jobs) {
    const { keyword, users, virtualClusters, statuses } = this;

    const filters = [];
    if (keyword !== '') {
      filters.push(
        ({ name, username, virtualCluster }) =>
          name.indexOf(keyword) > -1 ||
          username.indexOf(keyword) > -1 ||
          virtualCluster.indexOf(keyword) > -1,
      );
    }
    if (users.size > 0) {
      filters.push(({ username }) => users.has(username));
    }
    if (virtualClusters.size > 0) {
      filters.push(({ virtualCluster }) => virtualClusters.has(virtualCluster));
    }
    if (statuses.size > 0) {
      filters.push(job => statuses.has(getStatusText(job)));
    }
    if (filters.length === 0) return jobs;

    return jobs.filter(job => filters.every(filter => filter(job)));
  }
}

export default Filter;
