import React from 'react';
import Filter from './Filter';
import Pagination from './Pagination';

const Context = React.createContext({
  successJobs: null,
  filteredJobs: null,
  filter: new Filter(),
  setFilter(filter) {
    this.filter = filter;
  },
  pagination: new Pagination(),
  setPagination(pagination) {
    this.pagination = pagination;
  },
  currentJobConfig: null,
  setCurrentJobConfig(jobConfig) {
    this.currentJobConfig = jobConfig;
  },
});

export default Context;
