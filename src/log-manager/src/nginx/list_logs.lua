-- Copyright (c) Microsoft Corporation
-- All rights reserved.
-- MIT License
-- Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
-- documentation files (the "Software"), to deal in the Software without restriction, including without limitation
-- the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
-- to permit persons to whom the Software is furnished to do so, subject to the following conditions:
-- The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
-- THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
-- BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
-- NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
-- DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
-- OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

local cjson = require "cjson"
local lfs = require "lfs"
local path = require "path"

local util = require "util"

local function has_file_with_pattern(path, pattern)
  for file in lfs.dir(path) do
    if string.match(file, pattern) then
      return true
    end
  end
  return false
end

local args = ngx.req.get_uri_args()
local username = args["username"]
local framework_name = args["framework-name"]
local taskrole = args["taskrole"]
local pod_uid = args["pod-uid"]
local token = args["token"]

if not token or not username or not taskrole or not framework_name or not pod_uid then
  ngx.log(ngx.ERR, "some query parameters is nil")
  ngx.status = ngx.HTTP_BAD_REQUEST
  return ngx.exit(ngx.HTTP_OK)
end

if not util.is_input_validated(username) or not util.is_input_validated(framework_name) or
   not util.is_input_validated(taskrole) or not util.is_input_validated(pod_uid) then
  ngx.log(ngx.ERR, "some query parameters is invalid")
  ngx.status = ngx.HTTP_BAD_REQUEST
  return ngx.exit(ngx.HTTP_OK)
end

local log_query_param = "?username="..username.."&framework-name="..framework_name..
  "&pod-uid="..pod_uid.."&taskrole="..taskrole.."&token="..token
local log_dir = "/usr/local/pai/logs"..path.normalize("/"..username)..
  path.normalize("/"..framework_name)..path.normalize("/"..taskrole)..path.normalize("/"..pod_uid).."/"
local api_prefix = "/api/v1/logs/"

local ret = {}

if not util.is_path_under_log_dir(log_dir) or not path.isdir(log_dir) then
  ngx.log(ngx.ERR, "log folder not exists")
  ngx.status = ngx.HTTP_NOT_FOUND
  return ngx.exit(ngx.HTTP_OK)
end

for file in lfs.dir(log_dir) do
  if not path.isdir(log_dir..file) then
    if string.match(file, "^user%.pai%..*$") then
      local sub_str = string.sub(file, string.len("user.pai.") + 1)
      ret[sub_str] = api_prefix..file..log_query_param
    else
      ret[file] = api_prefix..file..log_query_param
    end
  elseif string.match(file, "^user-.*$") then
    local sub_str = string.sub(file, string.len("user-") + 1)
    ret[sub_str] = api_prefix..file..log_query_param
    if has_file_with_pattern(log_dir..file, "^@.*%.s") then
      ret[sub_str..".1"] = api_prefix..file..".1"..log_query_param
    end
  end
end

ngx.say(cjson.encode(ret))

