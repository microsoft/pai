local cjson = require "cjson.safe"

-- add your access/rewrite function

-- you may need your special access control code
local function mt_access()
	return true
end

-- function for request body rewrite
local function mt_rewrite()
	if ngx.req.get_method() ~= "POST" then
	  return true
	end

	ngx.req.read_body()
	local data = ngx.req.get_body_data()
	if(data ~= nil) then
		local obj = cjson.decode(data)
		local user = cjson.decode(ngx.var.auth_info)
		if obj and user then
			if(not obj.proxyUser) then
				obj.proxyUser = user.username		
				data = cjson.encode(obj)
				ngx.req.set_body_data(data)
			elseif obj.proxyUser ~= user.username then
				ngx.log(ngx.WARN, "bad username:" .. obj.proxyUser)
				ngx.status = 405
				ngx.header.content_type = "application/json; charset=utf-8"
				ngx.say("{\"error\": \"bad user name\"}")
				return false	
			end
		end
	end
	return true
end

-- route table format(method, uri-prefix, access, reqest-rewrite)
-- method: (all/get/post/head/put/delete)
-- uri-prefix: url prefix to match route, for example /mt/api/v1/jobs/
-- access: file name or function or nil for needn't authen, return ture for authorized, false for denied, you can response err msg
-- rewrite file name or function or nil for needn't rewrite, return true for success rewrite, false for bad rewrite or error, you can response err msg
local acl_table = {
{"get", "/api/", "./api-lua/access.lua", "./api-lua/rewrite.lua"},
{"all", "/api/[^/]*/vv/", "./api-lua/access.lua", mt_rewrite},
{"all", "/api/[^/]*/", "./api-lua/access.lua", "./api-lua/rewrite.lua"},
{"all", "/", "deny", nil},
}

local  _M = {}
_M.acl_table = acl_table
return _M
