import Convert from "../../../models/utils/convert-utils";
class Filter {
  constructor(keyword, filterKey) {
    this.filterKey = filterKey;
    this.keyword = keyword;
  }

  /**
   * @param {any[]} jobs
   */
  search(jobs, filters, keyword, key) {
    filters.push(
      jobs.filter((job) => {
        if (typeof job[key] === "number" && isNaN(keyword)) return false;
        if (typeof job[key] === "number") {
          if (key === "BatchTime") {
            const dataTime = Convert.date("Y/m/d/H:i:s", job[key])
              .split("/")
              .join("")
              .split(":")
              .join("");
            return dataTime.indexOf(keyword) > -1;
          } else {
            return job[key] === Number(keyword);
          }
        }
        return (
          job[key].trim().toLowerCase().indexOf(keyword.toLowerCase()) > -1
        );
      })
    );
  }
  apply(jobs) {
    const { keyword, filterKey } = this;
    if (keyword === "" || keyword === null || keyword === undefined)
      return jobs;
    let filterKeys;
    const filters = [];
    if (!Array.isArray(filterKey)) {
      filterKeys = [filterKey];
    } else {
      filterKeys = filterKey;
    }
    keyword
      .split(/[,，/\\|]/)
      .filter((w) => w)
      .map((keyword) =>
        filterKeys.map((key) => this.search(jobs, filters, keyword, key))
      );
    if (filters.length === 0) return jobs;
    return [...new Set(filters.reduce((pre, cur) => pre.concat(cur)))];
  }
}

export default Filter;
