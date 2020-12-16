export default class Ordering {
  /**
   * @param {"name" | "description" | "category"} field
   * @param {boolean | undefined} descending
   */
  constructor(field, descending=false) {
    this.field = field;
    this.descending = descending;
  }

  apply(examples, moduleDict) {
    const {field, descending} = this;
    let comparator;
    if (field == null) {
      return examples;
    }
    if (field === 'name') {
      comparator = descending
        ? (a, b) => (String(b.info.name).localeCompare(a.info.name))
        : (a, b) => (String(a.info.name).localeCompare(b.info.name));
    } else if (field === 'category') {
      comparator = descending
      ? (a, b) => (String(b.info.category).localeCompare(a.info.category))
      : (a, b) => (String(a.info.category).localeCompare(b.info.category));
    } else if (field === 'description') {
      comparator = descending
      ? (a, b) => (String(b.info.description).localeCompare(a.info.description))
      : (a, b) => (String(a.info.description).localeCompare(b.info.description));
    } else if (field === 'module') {
      comparator = descending
      ? (a, b) => (String(`${moduleDict[b.info.moduleId].name} : ${moduleDict[b.info.moduleId].version}`).localeCompare(`${moduleDict[a.info.moduleId].name} : ${moduleDict[a.info.moduleId].version}`))
      : (a, b) => (String(`${moduleDict[a.info.moduleId].name} : ${moduleDict[a.info.moduleId].version}`).localeCompare(`${moduleDict[b.info.moduleId].name} : ${moduleDict[b.info.moduleId].version}`));
    } else if (field === 'group') {
      comparator = descending
      ? (a, b) => (String(b.info.group).localeCompare(a.info.group))
      : (a, b) => (String(a.info.group).localeCompare(b.info.group));
    }
    return examples.slice().sort(comparator);
  }
}
