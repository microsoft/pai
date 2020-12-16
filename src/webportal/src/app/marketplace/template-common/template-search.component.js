"use strict";
require('./cards-format.scss');

const loadingComponent = require('./loading.ejs');
const viewCardsComponent = require('./cards.ejs');
const {defaultRestServerClient} = require('../../../common/http-client');
const githubThrottled = require('./github-throttled');

const generateUI = function(type, data, limit) {
  if (data.length == 0) return '';

  let newdata = [];
  data.forEach(function(item) {
      newdata.push({
          type: item.type,
          name: item.name,
          version: item.version,
          avatar: `/assets/img/${item.type}.png`,
          description: item.description,
          contributor: item.contributor,
          // star: item.rating,
          // downloads: item.count,
      });
  });
  return viewCardsComponent({type: type, data: newdata, limit: limit});
};

const generateLoading = function() {
  return loadingComponent;
};

const load = function(type, callback, limit = 4) {
  defaultRestServerClient.get(`/api/v2/template/${type}`).then((response) => {
    let data = response.data.items;
    if (callback) {
      callback({type: generateUI(type, data, limit)});
    }
  });
};

const search = function(query, types, callback, limit = 4) {
  if (query) {
    defaultRestServerClient.get('/api/v2/template?query=' + encodeURIComponent(query)).then((response) => {
      let data = response.data.items;
      let categories = {};
      types.forEach((item) => {
        categories[item] = [];
      });
      data.forEach((item) => {
        if (item.type in categories) {
          categories[item.type].push(item);
        }
      });
      Object.keys(categories).forEach((type) => {
        categories[type] = generateUI(type, categories[type], limit);
      });
      if (callback) {
        callback(categories);
      }
    }).catch((err) => {
      if (err.response && err.response.status === 500) {
        githubThrottled();
      } else {
        alert(err);
      }
    });
  }
};

module.exports = {
  generateLoading,
  load,
  search,
};
