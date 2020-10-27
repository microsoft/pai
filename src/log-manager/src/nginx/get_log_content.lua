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

local fls = require 'lfs'

function get_rotated_log(log_path)
  for file in fls.dir(path) do
    rotated_log_name = string.match(file, "^@.*%.s")
    if rotated_log_name then
      return rotated_log_name
    end
  end
end


local args = ngx.req.get_uri_args()
local user_name = args["user_name"]
local framework_name = args["framework_name"]
local taskrole = args["taskrole"]
local pod_uid = args["pod_uid"]
local token = args["token"]
local tail_mode = args["tail_mode"]

local path_prefix = "/usr/local/pai/logs/"..user_name.."/".. framework_name.."/".. task_role.."/"..pod_uid.."/"
local log_name = ngx.var[1]

local log_path = path_prefix..log_name
if string.match(log_name, "^user-.*$") then
  -- we only keep one rotated log in log manager
  if string.match(log_name, "%.1$") then
    rotated_log_name = get_rotated_log(path..log_name)
    if not rotated_log_name
      ngx.status = ngx.HTTP_NOT_FOUND
      return ngx.exit(ngx.HTTP_OK)
    else
      log_path = path_prefix..log_name.."/"..rotated_log_name
    end
  else
    log_path = path_prefix..log_name.."/current"
  end
end

if (tail_mode == "true") then
  logs = io.popen("tail -c 16k "..log_path)
else then
  logs = io.popen("cat "..log_path)
end

for line in logs:lines() do
  ngx.say(line)
end
