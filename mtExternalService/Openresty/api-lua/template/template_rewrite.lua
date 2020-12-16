local cjson = require "cjson.safe"

--this is a sample rewrite file, you can modify it for you purpose
local function add_user_name()
	local ret = ngx.req.read_body()
	local data = ngx.req.get_body_data()
	if(data ~= nil) then
	ngx.log(ngx.WARN, "rewrite request body:" .. data)
	local obj = cjson.decode(data)
	obj.proxyUser=ngx.var.auth_info
	
	data = cjson.encode(obj)
	ngx.req.set_body_data(data)
	end
end

if ngx.req.get_method() == "POST" then
  add_user_name()
end

if false then
	ngx.log(ngx.WARN, "bad username:" .. ngx.status)
	ngx.status = 405
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say("{\"error\": \"bad user name\"}")
	--ngx.exit(ngx.OK)
	return false
end

return true