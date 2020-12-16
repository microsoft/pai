export default class Ordering {
  /**
   * @param {"name" | "description" | "version" | "owner" | "status" | undefined} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending=false) {
    this.field = field;
    this.descending = descending;
  }

  apply(modules) {
    const {field, descending} = this;
    let comparator;
    if (field == null) {
      return modules;
    }
    if (field === 'name') {
      comparator = descending
        ? (a, b) => (String(b.name).localeCompare(a.name))
        : (a, b) => (String(a.name).localeCompare(b.name));
    } else if (field === 'description') {
      comparator = descending
      ? (a, b) => (String(b.description).localeCompare(a.description))
      : (a, b) => (String(a.description).localeCompare(b.description));
    } else if (field === 'version') {
      comparator = descending
      ? (a, b) => (String(b.version).localeCompare(a.version))
      : (a, b) => (String(a.version).localeCompare(b.version));
    } else if (field === 'owner') {
      comparator = descending
      ? (a, b) => (String(b.owner).localeCompare(a.owner))
      : (a, b) => (String(a.owner).localeCompare(b.owner));
    } else if (field === 'status') {
      comparator = descending
      ? (a, b) => (String(b.status).localeCompare(a.status))
      : (a, b) => (String(a.status).localeCompare(b.status));
    } else if (field === 'category') {
      comparator = descending
      ? (a, b) => (String(b.category).localeCompare(a.category))
      : (a, b) => (String(a.category).localeCompare(b.category));
    }
    return modules.slice().sort(comparator);
  }
}
