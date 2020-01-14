class Pagination {
  constructor(itemsPerPage = 5, pageIndex = 0) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
  }

  apply(items) {
    const { itemsPerPage, pageIndex } = this;
    const start = itemsPerPage * pageIndex;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }
}

export default Pagination;
