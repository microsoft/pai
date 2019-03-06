import {getModified, getDuration, getStatusIndex} from './utils';

export default class Ordering {
  /**
   * @param {"name" | "modified" | "user" | "duration" | “virtualCluster” | "status" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending=false) {
    this.field = field;
    this.descending = descending;
  }

  apply(jobs) {
    const {field, descending} = this;
    let comparator;
    if (field == null) {
      return jobs;
    }
    if (field === 'name') {
      comparator = descending
        ? (a, b) => (a.name < b.name ? 1 : a.name > b.name ? -1 : 0)
        : (a, b) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0);
    } else if (field === 'modified') {
      comparator = descending ? (a, b) => {
        const ma = getModified(a);
        const mb = getModified(b);
        return ma < mb ? 1 : ma > mb ? -1 : 0;
      } : (a, b) => {
        const ma = getModified(a);
        const mb = getModified(b);
        return ma > mb ? 1 : ma < mb ? -1 : 0;
      };
    } else if (field === 'user') {
      comparator = descending
        ? (a, b) => (a.username < b.username ? 1 : a.username > b.username ? -1 : 0)
        : (a, b) => (a.username > b.username ? 1 : a.username < b.username ? -1 : 0);
    } else if (field === 'duration') {
      comparator = descending ? (a, b) => {
        const da = getDuration(a);
        const db = getDuration(b);
        return da < db ? 1 : da > db ? -1 : 0;
      } : (a, b) => {
        const da = getDuration(a);
        const db = getDuration(b);
        return da > db ? 1 : da < db ? -1 : 0;
      };
    } else if (field === '“virtualCluster”') {
      comparator = descending
        ? (a, b) => (a.vitualCluster < b.vitualCluster ? 1 : a.vitualCluster > b.vitualCluster ? -1 : 0)
        : (a, b) => (a.vitualCluster > b.vitualCluster ? 1 : a.vitualCluster < b.vitualCluster ? -1 : 0);
    } else if (field === 'status') {
      comparator = descending ? (a, b) => {
        const sa = getStatusIndex(a);
        const sb = getStatusIndex(b);
        return sa < sb ? 1 : sa > sb ? -1 : 0;
      }: (a, b) => {
        const sa = getStatusIndex(a);
        const sb = getStatusIndex(b);
        return sa > sb ? 1 : sa < sb ? -1 : 0;
      };
    }
    return jobs.slice().sort(comparator);
  }
}
