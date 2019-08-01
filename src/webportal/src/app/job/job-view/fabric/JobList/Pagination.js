export default class Pagination {
  /**
   * @param {number} itemsPerPage
   * @param {number} pageIndex
   */
  constructor(itemsPerPage = 20, pageIndex = 0) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
  }

  /**
   * @param {any[]} items
   * @returns {any[]}
   */
  apply(items) {
    const { itemsPerPage, pageIndex } = this;
    const start = itemsPerPage * pageIndex;
    const end = itemsPerPage * (pageIndex + 1);
    return items.slice(start, end).map(item => {
      item.key = `${item.username}~${item.name}`;
      return item;
    });
  }
}
