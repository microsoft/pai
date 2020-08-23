import React from 'react';

import Filter from './Filter';
import Pagination from './Pagination';
import Ordering from './Ordering';

export default React.createContext({
  allJobs: null,
  refreshJobs() {
    this.allJobs = null;
  },
  filteredJobsInfo: { totalCount: 0, data: [], pageIndex: 0 },
  refreshFilteredJobsInfo() {
    this.filteredJobsInfo = { totalCount: 0, data: [], pageIndex: 0 };
  },
  selectedJobs: [],
  setSelectedJobs(selectedJobs) {
    this.selectedJobs = selectedJobs;
  },

  stopJob(job) {
    job.executionType = 'STOP';
  },

  username: '',

  filter: new Filter(),
  setFilter(filter) {
    this.filter = filter;
  },

  pagination: new Pagination(),
  setPagination(pagination) {
    this.pagination = pagination;
  },

  ordering: new Ordering(),
  setOrdering(ordering) {
    this.ordering = ordering;
  },
});
