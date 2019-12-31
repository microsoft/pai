import React from 'react';
import Filter from './Filter';
import Pagination from './Pagination';

const Context = React.createContext({
  successJobs: null,
  setSuccessjobs(jobs) {
    this.successJobs = jobs;
  },
  filteredJobs: null,
  setFilteredJobs(filteredJobs) {
    this.filteredJobs = filteredJobs;
  },
  filter: new Filter(),
  setFilter(filter) {
    this.filter = filter;
  },
  pagination: new Pagination(),
  setPagination(pagination) {
    this.pagination = pagination;
  },
  currentJob: null,
  setCurrentJob(job) {
    this.currentJob = job;
  },
  currentJobConfig: null,
  setCurrentJobConfig(jobConfig) {
    this.currentJobConfig = jobConfig;
  },
});

export default Context;
