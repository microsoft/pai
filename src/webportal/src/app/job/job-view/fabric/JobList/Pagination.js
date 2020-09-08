// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

const LOCAL_STORAGE_KEY = 'pai-job-pagination';

export default class Pagination {
  /**
   * @param {number} itemsPerPage
   * @param {number} pageIndex
   */
  constructor(itemsPerPage = 20, pageIndex = 0) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
  }

  save() {
    const content = JSON.stringify({
      itemsPerPage: this.itemsPerPage,
      pageIndex: this.pageIndex,
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const { itemsPerPage, pageIndex } = JSON.parse(content);
      if (itemsPerPage !== undefined) {
        this.itemsPerPage = itemsPerPage;
      }
      if (pageIndex !== undefined) {
        this.pageIndex = pageIndex;
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  apply() {
    const { itemsPerPage, pageIndex } = this;
    const start = itemsPerPage * pageIndex;
    return {
      offset: start,
      limit: itemsPerPage,
    };
  }
}
