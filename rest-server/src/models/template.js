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

const has = function(name, version, callback) {
  client.hexists(redisConfig.templateKey(name), version, (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, num > 0);
    }
  });
};

const top = function(type, offset, count, callback) {
  let key = null;
  switch (type) {
    case 'script':
      key = redisConfig.scriptUsedKey;
      break;
    case 'data':
      key = redisConfig.dataUsedKey;
      break;
    case 'dockerimage':
      key = redisConfig.dockerUsedKey;
      break;
    case 'job':
      key = redisConfig.jobUsedKey;
      break;
    default:
      return callback(new Error('Unknown template type'), null);
  }
  client.zrevrange(key, offset, offset + count, 'WITHSCORES', (err, list) => {
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

const load = function(name, version, callback) {
  client.hget(redisConfig.templateKey(name), version, (err, res) => {
    if (err) {
      callback(err, null);
    } else {
      if (res) {
        client.zincrby(redisConfig.jobUsedKey, 1, name);
      }
      callback(null, yaml.safeLoad(res));
    }
  });
};

const save = function(template, callback) {
  let usedKey = null;
  let name = null;
  let version = null;
  if (template.job) {
    usedKey = redisConfig.jobUsedKey;
    name = template.job.name;
    version = template.job.version;
  } else {
    switch (template.type) {
      case 'script':
        usedKey = redisConfig.scriptUsedKey;
        break;
      case 'data':
        usedKey = redisConfig.dataUsedKey;
        break;
      case 'dockerimage':
        usedKey = redisConfig.dockerUsedKey;
        break;
      default:
        return callback(new Error('Unknown template type'), null);
    }
    name = template.name;
    version = template.version;
  }
  client.hset(redisConfig.templateKey(name), version, JSON.stringify(template), (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      client.hset(redisConfig.headIndexKey, name, version, (err, num) => {
        if (err) {
          callback(err, null);
        } else {
          client.zadd(usedKey, 'NX', 1, name);
          callback(null, num);
        }
      });
    }
  });
};

module.exports = {has, top, load, save};
