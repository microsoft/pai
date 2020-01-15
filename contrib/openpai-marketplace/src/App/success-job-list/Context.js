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

  // job detail
  jobInfo: null,
  rawJobConfig: null,
  sshInfo: null,

  // open job detail
  openJobDetail: false,
  setOpenJobDetail(flag) {
    this.openJobDetail = flag;
  },

  // published market item info
  name: '',
  setName(name) {
    this.name = name;
  },
  category: 'custom',
  setCategory(category) {
    this.category = category;
  },
  tags: [],
  setTags(tags) {
    this.tags = tags;
  },
  introduction: '',
  setIntroduction(introduction) {
    this.introduction = introduction;
  },
  description: '',
  setDescription(description) {
    this.description = description;
  },

  // success dialog title
  successDialogTitle: 'Publish to Marketplace',
  setSuccessDialogTitle(title) {
    this.successDialogTitle = title;
  },
});

export default Context;
