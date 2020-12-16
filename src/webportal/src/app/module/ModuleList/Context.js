import React from 'react';

import Filter from './Filter';
import Pagination from './Pagination';
import Ordering from './Ordering';

export default React.createContext({
  allModules: null,
  moduleDetail: null,
  setModuleDetail(moduleDetail) {
    this.moduleDetail = moduleDetail;
  },
  refreshModules() {
    this.allModules = null;
  },
  filteredModules: [],
  selectedModules: [],
  setSelectedModules(selectedModules) {
    this.selectedModules = selectedModules;
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
