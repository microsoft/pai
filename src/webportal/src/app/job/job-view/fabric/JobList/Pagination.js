export default class Pagination {
  /**
   * @param {number} itemsPerPage
   * @param {number} pageIndex
   */
  constructor(itemsPerPage = 20, pageIndex = 0) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
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
