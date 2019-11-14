import React from 'react';
import Filter from './Filter';
import Pagination from './Pagination';

export default React.createContext({
  itemList: null,
  filteredItems: null,
  filter: new Filter(),
  setFilter(filter) {
    this.filter = filter;
  },
  pagination: new Pagination(),
  setPagination(pagination) {
    this.pagination = pagination;
  },
});
