const LOCAL_STORAGE_KEY = 'MT-example-filter';

class Filter {
  constructor(
    keyword = '',
    names = new Set(),
    descriptions = new Set(),
    categories = new Set(),
    modules = new Set(),
    groups = new Set()
  ) {
    this.keyword = keyword;
    this.names = names;
    this.descriptions = descriptions;
    this.modules = modules;
    this.categories = categories;
    this.groups = groups;
  }

  save() {
    const content = JSON.stringify({
      names: Array.from(this.names),
      descriptions: Array.from(this.descriptions),
      categories: Array.from(this.categories),
      modules: Array.from(this.modules),
      groups: Array.from(this.groups)
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const {names, descriptions, categories, modules, groups} = JSON.parse(content);
      if (Array.isArray(names)) {
        this.names = new Set(names);
      }
      if (Array.isArray(descriptions)) {
        this.descriptions = new Set(descriptions);
      }
      if (Array.isArray(categories)) {
        this.owners = new Set(categories);
      }
      if (Array.isArray(modules)) {
        this.statuses = new Set(modules);
      }
      if (Array.isArray(groups)) {
        this.statuses = new Set(groups);
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  /**
   * @param {any[]} examples
   */
  apply(examples, moduleDict) {
    const {keyword, names, descriptions, categories, modules, groups} = this;
    const filters = [];
    if (keyword !== '') {
      filters.push(({
        info
      }) => (
        info.name.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        info.category.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        info.description.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        info.group.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        `${moduleDict[info.moduleId].name} : ${moduleDict[info.moduleId].version}`.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1
      ));
    }
    if (names.size > 0) {
      filters.push(({info}) => names.has(info.name));
    }
    if (descriptions.size > 0) {
      filters.push(({info}) => descriptions.has(info.description));
    }
    if (categories.size > 0) {
      filters.push(({info}) => categories.has(info.category));
    }
    if (modules.size > 0) {
      filters.push(({info}) => modules.has(info.module));
    }
    if (groups.size > 0) {
      filters.push(({info}) => groups.has(info.group));
    }
    if (filters.length === 0) return examples;
    return examples.filter((examples) => filters.every((filter) => filter(examples)));
  }
}

export default Filter;

