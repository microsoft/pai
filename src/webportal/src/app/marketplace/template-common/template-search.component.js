require('./cards-format.scss');

const loadingComponent = require('./loading.ejs');
const viewCardsComponent = require('./cards.ejs');
const userAuth = require('../../user/user-auth/user-auth.component');
const webportalConfig = require('../../config/webportal.config.js');
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
    userAuth.checkToken((token) => {
      $.ajax({
        url: `${webportalConfig.restServerUri}/api/v2/template?query=` + encodeURIComponent(query),
        type: 'GET',
        dataType: 'json',
        beforeSend: function setHeader(xhr) {
          if (token) {
            // Used for the backend server to fetch current user's GitHub PAT
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          }
        },
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
        error: function(jqxhr, _, error) {
          if (jqxhr.status == 500) {
              githubThrottled();
          } else {
              alert(error);
          }
        },
      });
    }, false);
  }
};

module.exports = {
  generateLoading,
  load,
  search,
};
