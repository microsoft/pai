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


local lfs = require "lfs"
local path = require "path"

local guard = require "guard"
local util = require "util"

local function get_rotated_log(log_path)
  for file in lfs.dir(log_path) do
    local rotated_log_name = string.match(file, "^@.*%.s")
    if rotated_log_name then
      return rotated_log_name
    end
  end
end

guard.check_token()

local args = ngx.req.get_uri_args()
local username = args["username"]
local framework_name = args["framework-name"]
local taskrole = args["taskrole"]
local pod_uid = args["pod-uid"]
local tail_mode = args["tail-mode"]

if not username or not taskrole or not framework_name or not pod_uid then
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

local file_prefix = "/usr/local/pai/logs"
local log_dir = file_prefix..path.normalize("/"..username)..
  path.normalize("/"..framework_name)..path.normalize("/"..taskrole)..path.normalize("/"..pod_uid).."/"

local log_name = path.normalize(ngx.var[1])
if not util.is_input_validated(log_name) then
  ngx.log(ngx.ERR, "log name is invalid")
  ngx.status = ngx.HTTP_BAD_REQUEST
  return ngx.exit(ngx.HTTP_OK)
end

local log_path = log_dir..log_name
ngx.log(ngx.INFO, "get log name "..log_name)
if string.match(log_name, "^user%-.*$") then
  -- we only keep one rotated log in log manager
  if string.match(log_name, "%.1$") then
    local parent_path = log_dir..string.sub(log_name, 1, string.len(log_name) - 2)
    local rotated_log_name = get_rotated_log(parent_path)
    if not rotated_log_name then
      ngx.status = ngx.HTTP_NOT_FOUND
      return ngx.exit(ngx.HTTP_OK)
    else
      log_path = parent_path.."/"..rotated_log_name
    end
  else
    log_path = log_dir..log_name.."/current"
  end
end

ngx.log(ngx.INFO, "get log from path"..log_path)

if not util.is_path_under_log_dir(log_path) or not path.isfile(log_path) then
  ngx.log(ngx.ERR, log_path.." not exists")
  ngx.status = ngx.HTTP_NOT_FOUND
  return ngx.exit(ngx.HTTP_OK)
end

if (tail_mode == "true") then
  ngx.req.set_header("Range", "bytes=-16384")
end

-- Refer https://www.openwall.com/lists/oss-security/2020/03/18/1. set_uri may cause security issue.
-- Here we need to make sure the log_path is valid
ngx.req.set_uri("/~/"..string.sub(path.abspath(log_path), string.len(file_prefix) + 1), true)

