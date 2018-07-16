// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


const yaml = require('js-yaml');
const redisConfig = require('../config/redis');
const redis3 = require('../util/redis3');

const client = redis3(redisConfig.connectionUrl, {prefix: redisConfig.keyPrefix});

const hasTemplate = function(name, version, callback) {
  client.hexists(redisConfig.templateKey(name), version, (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, num > 0);
    }
  });
};

const getRankedTemplateList = function(offset, count, callback) {
  client.zrevrange(redisConfig.usedCountKey, offset, offset + count, 'WITHSCORES', (err, list) => {
    if (err) {
      callback(err, null);
    } else {
      let cmds = [];
      let rank = [];
      for (let i = 0; i < list.length; i += 2) {
        let name = list[i];
        let count = list[i + 1];
        cmds.push(['hget', redisConfig.headIndexKey, name]);
        rank.push({'name': name, 'count': count});
      }
      client.multi(cmds).exec((err, versionList) => {
        if (err) {
          callback(err, null);
        } else {
          let cmds = [];
          for (let i = 0; i < versionList.length; i++) {
            let version = versionList[i];
            cmds.push(['hget', redisConfig.templateKey(rank[i].name), version]);
            rank[i].version = version;
          }
          client.multi(cmds).exec((err, templateList) => {
            if (err) {
              callback(err, null);
            } else {
              let result = [];
              for (let i = 0; i < templateList.length; i++) {
                let item = yaml.safeLoad(templateList[i]);
                item.count = rank[i].count;
                result.push(item);
              }
              callback(null, result);
            }
          });
        }
      });
    }
  });
};

const getTemplateList = function(callback) {
  client.hgetall(redisConfig.headIndexKey, (err, hash) => {
    if (err) {
      callback(err, null);
    } else {
      let cmds = [];
      for (let name in hash) {
        if (hash.hasOwnProperty(name)) {
          let version = hash[name];
          cmds.push(['hget', redisConfig.templateKey(name), version]);
        }
      }
      client.multi(cmds).exec((err, replies) => {
        if (err) {
          callback(err, null);
        } else {
          let list = [];
          replies.forEach(function(element) {
            list.push(yaml.safeLoad(element));
          });
          callback(null, list);
        }
      });
    }
  });
};

const getTemplate = function(name, version, callback) {
  client.hget(redisConfig.templateKey(name), version, (err, res) => {
    if (err) {
      callback(err, null);
    } else {
      if (res) {
        client.zincrby(redisConfig.usedCountKey, 1, name);
      }
      callback(null, yaml.safeLoad(res));
    }
  });
};

const saveTemplate = function(name, version, template, callback) {
  client.hset(redisConfig.templateKey(name), version, JSON.stringify(template), (err, res) => {
    if (err) {
      callback(err, null);
    } else {
      client.hset(redisConfig.headIndexKey, name, version, (err, num) => {
        if (err) {
          callback(err, null);
        } else {
          client.zadd(redisConfig.usedCountKey, 'NX', 1, name);
          callback(null, num);
        }
      });
    }
  });
};

module.exports = {hasTemplate, getRankedTemplateList, getTemplateList, getTemplate, saveTemplate};
