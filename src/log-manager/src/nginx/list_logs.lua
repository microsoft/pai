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
local fls = require 'lfs'

function has_file_with_pattern(path, pattern)
  for file in fls.dir(path) do
    if string.match(file, pattern) then
      return true
    end
  end
  return false
end

function is_dir(path)
  return lfs.attributes(path, "mode") == "directory"
end

local args = ngx.req.get_uri_args()
local user_name = args["user_name"]
local framework_name = args["framework_name"]
local task_role = args["task_role"]
local pod_uid = args["pod_uid"]
local token = args["token"]

if not token or not user_name or not task_role or not framework_name or not pod_uid then
  ngx.status = ngx.HTTP_BAD_REQUEST
  return ngx.exit(ngx.HTTP_OK)
end

local log_query_param = "?user_name="..user_name.."&&framework_name="..framework_name.."&&pod_uid="..pod_uid.."&&token="..token
local path = "/usr/local/pai/logs/"..user_name.."/".. framework_name.."/".. task_role.."/"..pod_uid.."/"

ret = {}

for file in fls.dir(path) do
  if not is_dir(path..file) then
    if string.match(file, "^user%.pai%..*$") then
      sub_str = string.sub(file, string.len("user.pai.") + 1)
      ret[sub_str] = file..log_query_param
    else
      ret[file] = file..log_query_param
    end
  elseif string.match(file, "^user-.*$") then
    sub_str = string.sub(file, string.len("user-") + 1)
    ret[sub_str] = file..log_query_param
    if has_file_with_pattern(path..file, "^@.*%.s") then
      ret[sub_str..".1"] = file..".1"..log_query_param
    end
  end
end

ngx.say(cjson.encode(ret))
