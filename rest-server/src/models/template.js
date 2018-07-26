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


const config = require('../config/redis');
const redis3 = require('../util/redis3');

const client = redis3(config.connectionUrl);

const filter = function(query, callback) {
  let lua = `
local result = {}

local function filter(ttype, terms)
  local list = redis.call("ZRANGE", "marketplace:"..ttype..".used", 0, -1, "WITHSCORES")
  local name, count, version, content, template, rsum, rcnt = "", 0, "", "", nil, 0, 0
  for i = 1, table.getn(list), 2 do
    name = list[i]
    count = list[i + 1]
    version = redis.call("HGET", "marketplace:"..ttype..".index", name)
    content = redis.call("HGET", "marketplace:template:"..ttype.."."..name, version)
    local template = cjson.decode(content)
    if (template["job"] ~= nil) then
      template = template["job"]
    end
    for id, token in ipairs(terms) do
      if (string.find(name, token) or string.find(template["description"], token)) then
        rsum = redis.call("HGET", "marketplace:stats"..ttype.."."..name, "rating.sum")
        rcnt = redis.call("HGET", "marketplace:stats"..ttype.."."..name, "rating.count")
        table.insert(result, content)
        table.insert(result, count)
        if rsum and rcnt then
          table.insert(result, rsum / rcnt)
        else
          table.insert(result, 3)
        end
        break
      end
    end
  end
end

local query = "${query}"
if string.len(query) > 0 then
  if string.len(query) > 100 then
    query = string.sub(query, 1, 100)
  end
    local tofind = {}
    for token in string.gmatch(query, "%a+") do
       table.insert(tofind, token)
    end
    local targets = {"job", "data", "script", "dockerimage"}
    for key, value in ipairs(targets) do
      filter(value, tofind)
    end
end
return result
`;
  client.eval(lua, 0, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let list = [];
      for (let i = 0; i < res.length; i += 3) {
        if (res[i]) {
          let item = JSON.parse(res[i]);
          if (item.job) {
            item.type = item.job.type;
            item.name = item.job.name;
            item.version = item.job.version;
            item.contributor = item.job.contributor;
            item.description = item.job.description;
          }
          item.count = res[i + 1];
          item.rating = res[i + 2];
          list.push(item);
        }
      }
      list.sort((a, b) => {
        return b.count - a.count;
      });
      callback(null, list);
    }
  });
};

/**
 * Get the top K templates of range [offset, offset + count) by the given type.
 */
const top = function(type, offset, count, callback) {
  let usedKey = config.getUsedKey(type);
  let indexKey = config.getIndexKey(type);
  let statsKeyPrefix = config.getStatsKeyPrefix(type);
  let templatePrefix = config.getTemplateKeyPrefix(type);
  let lua = `
local selected = redis.call("ZREVRANGE", "${usedKey}", ${offset}, ${count}, "WITHSCORES")
local name, count, version, content, rsum, rcnt = "", 0, "", "", 0, 0
local result = {}
for i = 1, table.getn(selected), 2 do
  name = selected[i]
  count = selected[i + 1]
  version = redis.call("HGET", "${indexKey}", name)
  content = redis.call("HGET", "${templatePrefix}"..name, version)
  rsum = redis.call("HGET", "${statsKeyPrefix}"..name, "rating.sum")
  rcnt = redis.call("HGET", "${statsKeyPrefix}"..name, "rating.count")
  table.insert(result, content)
  table.insert(result, count)
  if rsum and rcnt then
    table.insert(result, rsum / rcnt)
  else
    table.insert(result, 3)
  end
end
return result
`;
  client.eval(lua, 0, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      let list = [];
      for (let i = 0; i < res.length; i += 3) {
        if (res[i]) {
          let item = JSON.parse(res[i]);
          if (type == 'job') {
            item.type = item.job.type;
            item.name = item.job.name;
            item.version = item.job.version;
            item.contributor = item.job.contributor;
            item.description = item.job.description;
          }
          item.count = res[i + 1];
          item.rating = res[i + 2];
          list.push(item);
        }
      }
      callback(null, list);
    }
  });
};

/**
 * Load a template.
 */
const load = function(type, name, version, use, callback) {
  let statsKey = config.getStatsKey(type, name);
  let usedKey = config.getUsedKey(type);
  if (use) {
    client.multi([
      ['HINCRBY', statsKey, 'used.count', 1],
      ['ZINCRBY', usedKey, 1, name],
    ]).exec(function(err, res) {
      if (err) {
        callback(err, null);
        return;
      }
    });
  }
  let contentKey = config.getTemplateKey(type, name);
  let lua = `
local function addStats(resource, rtype, rname)
  local count = redis.call("HGET", "marketplace:stats:"..rtype.."."..rname, "used.count")
  local rsum = redis.call("HGET", "marketplace:stats:"..rtype.."."..rname, "rating.sum")
  local rcnt = redis.call("HGET", "marketplace:stats:"..rtype.."."..rname, "rating.count")
  if not count then
    count = 0
  end
  local rating = 3
  if rsum and rcnt then
    rating = rsum / rcnt
  end
  resource["count"] = count
  resource["rating"] = rating
end

local content = redis.call("HGET", "${contentKey}", "${version}")
local template = cjson.decode(content)
if template["job"] ~= nil then
  addStats(template, template["job"]["type"], template["job"]["name"])
  for id, resource in ipairs(template["prerequisites"]) do
    addStats(resource, resource["type"], resource["name"])
  end
else
  addStats(template, template["type"], template["name"])
end
return cjson.encode(template)
`;
  client.eval(lua, 0, function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, JSON.parse(res));
    }
  });
};

/**
 * Save the template.
 * The second element in the callback argument list means whether <name, version> duplicates.
 */
const save = function(template, callback) {
  let name = null;
  let version = null;
  let type = null;
  if (template.job) {
    name = template.job.name;
    version = template.job.version;
    type = 'job';
  } else {
    name = template.name;
    version = template.version;
    type = template.type;
  }
  client.hsetnx(config.getTemplateKey(type, name), version, JSON.stringify(template), (err, num) => {
    if (err) {
      callback(err, null);
    } else {
      if (num == 0) {
        // The key is duplicated
        callback(null, true);
      } else {
        client.hset(config.getIndexKey(type), name, version, (err, num) => {
          if (err) {
            callback(err, null);
          } else {
            client.zadd(config.getUsedKey(type), 'NX', 0, name);
            callback(null, false);
          }
        });
      }
    }
  });
};

/**
 * Provide rating for the template.
 */
const mark = function(type, name, rating, callback) {
  client.multi([
    ['HINCRBY', config.getStatsKey(type, name), 'rating.count', 1],
    ['HINCRBY', config.getStatsKey(type, name), 'rating.sum', rating],
  ]).exec(function(err, res) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, res);
    }
  });
};

module.exports = {filter, top, load, save, mark};
