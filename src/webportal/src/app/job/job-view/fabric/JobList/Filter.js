import {getStatusText} from './utils';

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

  /**
   * @param {any[]} jobs
   */
  apply(jobs) {
    const {keyword, users, virtualClusters, statuses} = this;

    const filters = [];
    if (keyword !== '') {
      filters.push(({
        name,
        username,
        virtualCluster,
      }) => (
        name.indexOf(keyword) > -1 ||
        username.indexOf(keyword) > -1 ||
        virtualCluster.indexOf(keyword) > -1
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
    if (filters.length === 0) return jobs;

    return jobs.filter((job) => filters.every((filter) => filter(job)));
  }
}

export default Filter;
