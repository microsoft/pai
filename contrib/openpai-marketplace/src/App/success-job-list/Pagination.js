class Pagination {
  constructor(itemsPerPage = 20, pageIndex = 0) {
    this.itemsPerPage = itemsPerPage;
    this.pageIndex = pageIndex;
  }

  apply(itemList) {
    const { itemsPerPage, pageIndex } = this;
    const begin = pageIndex * itemsPerPage;
    const end = begin + itemsPerPage;
    return itemList.slice(begin, end);
  }
}

export default Pagination;
