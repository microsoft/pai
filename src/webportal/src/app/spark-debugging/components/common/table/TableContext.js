import React from 'react';

import Pagination from './Pagination';
import Ordering from './Ordering';
import Filter from './Filter';

const TableContext = React.createContext({
  tableProperty: null,

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

export default TableContext;