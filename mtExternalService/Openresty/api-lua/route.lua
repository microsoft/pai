local cjson = require "cjson.safe"
local jwt = require "resty.jwt"

-- store shared data in a worker
local share_data = {}

local function set_share_data(key, value)
    share_data[key] = value
    ngx.log(ngx.INFO, string.format("set_shard_data key: %s, value: %s", key, value))
end

local function get_share_data(key)
    local value = share_data[key]
    ngx.log(ngx.INFO, string.format("get_shard_data key: %s, value: %s", key, value))
    return value
end

-- store / get secret for jwt, secret can be password or pem format cert or public key
local function set_secret(secret)
    set_share_data("JWT_SECRET", secret)
end

local function get_secret()
    return get_share_data("JWT_SECRET")
end

-- do function or do file wrapper
local function do_action(act)
    ngx.log(ngx.INFO, string.format("do_action: %s", act))
    if(type(act) == "function") then
        ngx.log(ngx.INFO, "do action: function")
        return act()
    elseif(type(act) == "string") then
        if act == "permit" then
            ngx.log(ngx.INFO, "do action: permit")
            return true
        elseif act == "deny" then
            ngx.log(ngx.INFO, "do action: deny")
            return false
        else
            ngx.log(ngx.INFO, "do action: dofile " .. act)
            return dofile(act)
        end
    elseif(type(act) == "boolean") then
        ngx.log(ngx.INFO, "do action: boolean " .. tostring(act))
        return act
    elseif act == nil then
        ngx.log(ngx.INFO, "do action: nil(permit)")
        return true
    else
        ngx.log(ngx.WARN, "do action: unknown (deny) type " .. type(act))
        return false
    end
end

-- use first match policy, default permit
local function acl_check(acl_table, method, uri)
    ngx.log(ngx.INFO, string.format("acl check for method: %s, uri: %s", method, uri))
    if acl_table == nil then
        ngx.log(ngx.WARN, "acl_table is nil")
        return true
    end
    ngx.log(ngx.INFO, string.format("acl_table rule num: %d", #acl_table))
    for i=1, #acl_table do
        ngx.log(ngx.INFO, string.format("try rule id %d, method: %s, uri: %s, action: %s, rewrite: %s", 
            i, acl_table[i][1], acl_table[i][2], acl_table[i][3], acl_table[i][4]))
        if( acl_table[i][1] == "all" or acl_table[i][1] == method) then
            if ngx.re.match(uri, acl_table[i][2]) then
            --for match in uri:gmatch(acl_table[i][2]) do
                ngx.log(ngx.INFO, string.format("match rule id: %d, method: %s, url: %s", i, acl_table[i][1], acl_table[i][2]))
                -- access action
                if acl_table[i][3] ~= nil then
                    local ret = do_action(acl_table[i][3])
                    if not ret then
                        return false
                    end
                end
                -- rewrite action
                if acl_table[i][4] ~= nil then
                    local ret = do_action(acl_table[i][4])
                    if not ret then
                        return false
                    end
                end
                return true
            end
        end        
    end
    return true
end

-- common function to get sub cluster info
local function get_subcluster()
--[[
    local sub_cluster = ngx.var.http_sub_cluster
    if sub_cluster ~= nil then
        return string.lower(sub_cluster)
    end    
    sub_cluster = ngx.var.arg_subCluster
    if sub_cluster ~= nil then
        return string.lower(sub_cluster)
    end
    sub_cluster = ngx.var.cookie_subClusterUri
    if sub_cluster ~= nil then
        return string.lower(sub_cluster)
    end
--]]
    local sub_cluster = ngx.var.arg_subcluster
    if sub_cluster ~= nil then
        ngx.log(ngx.INFO, "subcluster parameter is: " .. sub_cluster)
        return string.lower(sub_cluster)
    end
    ngx.log(ngx.WARN, "get_subcluster return nil")
    return nil
end

-- forward to proxy
local function forward(target, acl_result, msg)
    -- TODO: add audit log 
    ngx.log(ngx.INFO, string.format("forward target %s acl_result %s msg %s", target, acl_result, msg))
    local append_msg = ''
    if msg then
        append_msg = ': ' .. msg
    end
    if acl_result == false then
        if(ngx.status == 0) then
            ngx.log(ngx.WARN, "Forbidden access " .. ngx.var.request_uri)
            ngx.header.content_type = "application/json; charset=utf-8"
            ngx.status = ngx.HTTP_FORBIDDEN
            --ngx.say("{\"error\": \"Forbidden access\"}")
            ngx.say(string.format('{"error": "Forbidden access%s"}', append_msg))
            ngx.exit(ngx.HTTP_FORBIDDEN)
        end
    elseif target then
        ngx.var.target = target
        ngx.log(ngx.INFO, "permit access " .. ngx.var.request_uri)
        return true
    else
        if(ngx.status == 0) then
            ngx.log(ngx.WARN, "Not found " .. ngx.var.request_uri)
            ngx.header.content_type = "application/json; charset=utf-8"
            ngx.status = ngx.HTTP_NOT_FOUND
            --ngx.say("{\"error\": \"Not found\"}")
            ngx.say(string.format('{"error": "Not found%s"}', append_msg))
            ngx.exit(ngx.HTTP_NOT_FOUND)
        end
    end
    return false
end

-- process subcluster based site to router to target server and do acl check
-- process_route(ngx.shared.mtrest_servers, acl_mtrest.acl_table)
local function process_route(rt_table, acl_table)
    local target = nil
    local ret = true
    local msg = nil

    if acl_table ~= nil then
        local method = string.lower(ngx.var.request_method)
        local uri = ngx.var.request_uri
        --print(string.format('method: %s, url: %s, sub cluster: %s', method, uri, sub_cluster))
        ret = acl_check(acl_table, method, uri)
        ngx.log(ngx.INFO, string.format('acl check result: %s, method: %s, url: %s', tostring(ret), method, uri))
    end
    
    if ret then
        local sub_cluster = get_subcluster()
        if sub_cluster == nil then
            msg = 'Missing url parameter: subcluster'
        elseif rt_table then
            --target = rt_table:get(sub_cluster)
            target = rt_table[sub_cluster]
            if target == nil then
                msg = 'No such subcluster: ' .. sub_cluster
            end
            ngx.log(ngx.INFO, string.format("found server for cluster: %s, url: %s", sub_cluster, target))
        end
    end

    return forward(target, ret, msg)
end

-- process single target server
local function process_target(target, acl_table)
    local ret = true
    
    ngx.log(ngx.INFO, string.format("found server for service url: %s", target))

    if acl_table ~= nil then
        local method = string.lower(ngx.var.request_method)
        local uri = ngx.var.request_uri
        --print(string.format('method: %s, url: %s, sub cluster: %s', method, uri, sub_cluster))
        ret = acl_check(acl_table, method, uri)
        ngx.log(ngx.INFO, string.format('acl check result: %s, method: %s, url: %s', tostring(ret), method, uri))
    end
    
    return forward(target, ret, nil)
end

-- load file and return content as string
local function load_file(file_name)
    if file_name == nil then
        ngx.log(ngx.WARN, "load file name is nil")
        return nil
    end
    ngx.log(ngx.INFO, "load file from " .. file_name)
    local f = io.open(file_name, "r")
    if f == nil then
        ngx.log(ngx.WARN, "open file failed, cant find file " .. file_name)
        return nil
    end
    local t = f:read("*a")
    f:close()
    if nil == t or "" == t then
        ngx.log(ngx.WARN, "read file failed from " .. file_name)
        return nil
    end
    return t
end

-- load json by json file
local function load_json(file_name)    
    local t = load_file(file_name)
    if nil == t or "" == t then
        ngx.log(ngx.WARN, "load json failed from " .. file_name)
        return nil
    end
    local j = cjson.decode(t)
    if j == nil then
        ngx.log(ngx.WARN, "decode json failed " .. file_name)
        ngx.log(ngx.INFO, t)
        return nil
    end
    return j
end

local MSG_GET_VALID_MTTOKEN = "See https://aka.ms/MTToken to get a valid MTToken";
-- jwt token check
local function access_check()
    local cjson_encode = cjson.encode
    local token = nil
    -- ignor token in cookie prevent CSRF attack
    --[[
    -- first try to find JWT token as url parameter e.g. ?token=BLAH
    local token = ngx.var.arg_token

    -- next try to find JWT token as Cookie e.g. token=BLAH
    if token == nil then
        token = ngx.var.cookie_token
    end
    --]]

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
        ngx.log(ngx.WARN, "missing JWT token or Authorization header")
        ngx.header.content_type = "application/json; charset=utf-8"
        --ngx.say("{\"error\": \"missing JWT token or Authorization header\"}")
        ngx.say(string.format('{"error": "Missing MTToken in http Authorization header: %s"}', MSG_GET_VALID_MTTOKEN))
        ngx.var.auth_status = "FAILED: Missing MTToken in http Authorization header"
        return false
    end

    -- validate any specific claims you need here
    -- https://github.com/SkyLothar/lua-resty-jwt#jwt-validators
    local validators = require "resty.jwt-validators"
    -- {"alg":"RS256","typ":"JWT"}{"sub":"pelian","admin":true,"iss":"restserver.magnetar","aud":"magnetar","otype":"AAD","osub":"pelian","iat":1585567711,"exp":1586172511}
    local claim_spec = {
        -- validators.set_system_leeway(15), -- time in seconds
        sub = validators.matches(".+"),
        exp = validators.is_not_expired(),
        -- iat = validators.is_not_before(),
        iss = validators.equals("restserver.magnetar"),
        aud = validators.equals("magnetar"),
        otype = validators.opt_equals_any_of({"AAD", "MT"}),
        osub = validators.opt_matches(".+"),
        -- name = validators.equals_any_of({ "John Doe", "Mallory", "Alice", "Bob" }),
    }


    -- make sure to set and put "env JWT_SECRET;" in nginx.conf
    
    local jwt_obj = jwt:verify(get_secret(), token, claim_spec)
    --local jwt_obj = jwt:verify(os.getenv("JWT_SECRET"), token, claim_spec)
    local auth_info = ""
    if not jwt_obj["verified"] then
        ngx.status = ngx.HTTP_UNAUTHORIZED
        ngx.log(ngx.WARN, jwt_obj.reason)
        ngx.header.content_type = "application/json; charset=utf-8"
        --ngx.say("{\"error\": \"" .. jwt_obj.reason .. "\"}")
        ngx.say(string.format('{"error": "%s: %s"}', jwt_obj.reason, MSG_GET_VALID_MTTOKEN))
        ngx.var.auth_status = string.format("FAILED: %s", jwt_obj.reason)
        return false
    else
        auth_info = cjson_encode(jwt_obj.payload)
        ngx.log(ngx.INFO, string.format("user %s authentication succeed.", jwt_obj.payload["sub"]))
        ngx.req.set_header("Authorization", "Bearer " .. token)
        ngx.req.set_header("AuthInfo", auth_info)
        ngx.var.auth_info = auth_info
        ngx.var.mt_user = jwt_obj.payload["sub"]
        ngx.var.auth_status = "OK"
        return true
    end
end

-- load acl_table by json file
local function load_acl_table(file_name)
    if file_name == nil then
        ngx.log(ngx.WARN, "load acl table from nil file name")
        return nil
    end
    ngx.log(ngx.INFO, "load acl table from " .. file_name) 
    local j = load_json(file_name)
    if j == nil then
        ngx.log(ngx.WARN, "load acl file failed " .. file_name)
        return nil
    end
    
    local acl_table = {}
    local i = 1
    for i=1, #j do
        acl_table[i] = {}
        acl_table[i][1] = j[i]["method"]
        acl_table[i][2] = j[i]["uri_regex"]
        acl_table[i][3] = j[i]["action"]
        if(j[i]["action"] == "check") then
            --acl_table[i][3] = "./api-lua/access.lua"
            acl_table[i][3] = access_check
        end
        acl_table[i][4] = nil
        ngx.log(ngx.INFO, string.format("rule id: %d, method: %s, uri_regex: %s, action: %s", i, j[i]["method"], j[i]["uri_regex"], j[i]["action"]))
    end
    return acl_table
end

local  _M = {}
_M.process_route = process_route
_M.process_target = process_target
_M.load_acl_table = load_acl_table
_M.set_share_data = set_share_data
_M.get_share_data = get_share_data
_M.load_file = load_file
_M.load_json = load_json
_M.set_secret = set_secret
_M.get_secret = get_secret
return _M




