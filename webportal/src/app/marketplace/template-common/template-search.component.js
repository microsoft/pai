require('./cards-format.scss');

const loadingComponent = require('./loading.ejs');
const viewCardsComponent = require('./cards.ejs');
const webportalConfig = require('../../config/webportal.config.js');

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
  $.ajax({
    url: `${webportalConfig.restServerUri}/api/v2/template/${type}`,
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      let data = res.items;
      if (callback) {
        callback({type: generateUI(type, data, limit)});
      }
    },
  });
};

const search = function(query, types, callback, limit = 4) {
  if (query) {
    $.ajax({
      url: `${webportalConfig.restServerUri}/api/v2/template?query=` + encodeURIComponent(query),
      type: 'GET',
      dataType: 'json',
      success: function(res) {
        let data = res.items;
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
      },
    });
  }
};

module.exports = {
  generateLoading,
  load,
  search,
};
