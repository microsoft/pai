local jwt = require "resty.jwt"
local cjson = require "cjson.safe"

local cjson_encode = cjson.encode

-- first try to find JWT token as url parameter e.g. ?token=BLAH
local token = ngx.var.arg_token

-- next try to find JWT token as Cookie e.g. token=BLAH
if token == nil then
    token = ngx.var.cookie_token
end

-- try to find JWT token in Authorization header Bearer string
if token == nil then
    local auth_header = ngx.var.http_Authorization
    if auth_header then
        local a,b
        a, b, token = string.find(auth_header, "Bearer%s+(.+)")
    end
end

-- finally, if still no JWT token, kick out an error and exit
if token == nil then
    ngx.status = ngx.HTTP_UNAUTHORIZED
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say("{\"error\": \"missing JWT token or Authorization header\"}")
    --ngx.exit(ngx.HTTP_UNAUTHORIZED)
	return false
end

-- validate any specific claims you need here
-- https://github.com/SkyLothar/lua-resty-jwt#jwt-validators
local validators = require "resty.jwt-validators"
local claim_spec = {
    -- validators.set_system_leeway(15), -- time in seconds
    -- exp = validators.is_not_expired(),
    -- iat = validators.is_not_before(),
    -- iss = validators.opt_matches("^http[s]?://yourdomain.auth0.com/$"),
    -- sub = validators.opt_matches("^[0-9]+$"),
    -- name = validators.equals_any_of({ "John Doe", "Mallory", "Alice", "Bob" }),
}


-- make sure to set and put "env JWT_SECRET;" in nginx.conf
local jwt_obj = jwt:verify(os.getenv("JWT_SECRET"), token, claim_spec)
local auth_info = ""
if not jwt_obj["verified"] then
    ngx.status = ngx.HTTP_UNAUTHORIZED
    ngx.log(ngx.WARN, jwt_obj.reason)
    ngx.header.content_type = "application/json; charset=utf-8"
    ngx.say("{\"error\": \"" .. jwt_obj.reason .. "\"}")
    --ngx.exit(ngx.HTTP_UNAUTHORIZED)
	return false
---return ngx.redirect("http://your-site-host/get_jwt")
else
	auth_info = cjson_encode(jwt_obj.payload)
	ngx.req.set_header("Authorization", "Bearer " .. token)
	ngx.req.set_header("AuthInfo", auth_info)
	ngx.var.auth_info = auth_info
	return true
end

-- optionally set Authorization header Bearer token style regardless of how token received
-- if you want to forward it by setting your nginx.conf something like:
--     proxy_set_header Authorization $http_authorization;`




