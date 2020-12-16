const LOCAL_STORAGE_KEY = 'MT-module-filter';

class Filter {
  constructor(
    keyword = '',
    names = new Set(),
    descriptions = new Set(),
    owners = new Set(),
    statuses = new Set(),
    categories = new Set(),
  ) {
    this.keyword = keyword;
    this.names = names;
    this.descriptions = descriptions;
    this.owners = owners;
    this.statuses = statuses;
    this.categories = categories;
  }

  save() {
    const content = JSON.stringify({
      names: Array.from(this.names),
      descriptions: Array.from(this.descriptions),
      owners: Array.from(this.owners),
      statuses: Array.from(this.statuses),
      categories: Array.from(this.categories)
    });
    window.localStorage.setItem(LOCAL_STORAGE_KEY, content);
  }

  load() {
    try {
      const content = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      const {names, descriptions, owners, statuses, categories} = JSON.parse(content);
      if (Array.isArray(names)) {
        this.names = new Set(names);
      }
      if (Array.isArray(descriptions)) {
        this.descriptions = new Set(descriptions);
      }
      if (Array.isArray(owners)) {
        this.owners = new Set(owners);
      }
      if (Array.isArray(status)) {
        this.statuses = new Set(statuses);
      }
      if (Array.isArray(categories)) {
        this.categories = new Set(categories);
      }
    } catch (e) {
      window.localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }

  /**
   * @param {any[]} modules
   */
  apply(modules) {
    const {keyword, names, descriptions, owners, statuses, categories} = this;
    const filters = [];
    if (keyword !== '') {
      filters.push(({
        name,
        description,
        owner,
        status,
        category,
        id
      }) => (
        name.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        description.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        owner.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 || 
        status.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        category.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1 ||
        id.toLowerCase().indexOf(keyword.trim().toLowerCase()) > -1
      ));
    }
    if (names.size > 0) {
      filters.push(({name}) => names.has(name));
    }
    if (descriptions.size > 0) {
      filters.push(({description}) => descriptions.has(description));
    }
    if (owners.size > 0) {
      filters.push(({owner}) => owners.has(owner));
    }
    if (statuses.size > 0) {
      filters.push(({status}) => statuses.has(status));
    }
    if (categories.size > 0) {
      filters.push(({category}) => categories.has(category));
    }
    if (filters.length === 0) return modules;
    return modules.filter((modules) => filters.every((filter) => filter(modules)));
  }
}

export default Filter;
