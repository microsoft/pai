import React from 'react';

import Filter from './Filter';
import Pagination from './Pagination';
import Ordering from './Ordering';

export default React.createContext({
  allExamples: null,
  refreshExamples() {
    this.allExamples = null;
  },
  filteredExamples: [],
  selectedExamples: [],
  setSelectedExamples(selectedExamples) {
    this.selectedExamples = selectedExamples;
  },

  filter: new Filter(),
  setFilter(filter) {
    this.filter = filter;
  },
  moduleDict: {},
  setModuleDict(moduleDict) {
      this.moduleDict = moduleDict;
  },
  pagination: new Pagination(),
  setPagination(pagination) {
    this.pagination = pagination;
  },

  ordering: new Ordering(),
  setOrdering(ordering) {
    this.ordering = ordering;
  },

  showExampleCreate: null,
  setShowExampleCreate(showExampleCreate) {
    this.showExampleCreate = showExampleCreate;
  }
});
