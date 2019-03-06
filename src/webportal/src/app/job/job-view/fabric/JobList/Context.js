import React from 'react';

import Filter from './Filter';
import Pagination from './Pagination';
import Ordering from './Ordering';

export default React.createContext({
  allJobs: null,
  filteredJobs: [],

  stopJob(job) {
    job.executionType = 'STOP';
  },

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
