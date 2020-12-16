--local route = require "route"
--local http = require "http"

local function check_health(servers, health_url)
    --local servers = route.get_share_data("mtrest_servers")
    local result = {}
    local reqs = {}   
    local count = 1
    if (servers == nil) or (next(servers) == nil) or (health_url == nil) then
        return nil
    end
    print("health url: ", health_url)
    if string.sub(health_url, 1,1) == "/" then
        health_url = string.sub(health_url, 2)
    end
    for k, v in pairs(servers) do
        print(string.format("key: %s, value: %s", k, v))
        local url = "/proxy/" .. v
        if string.sub(url, #url, #url) ~= "/" then
            url = url .. "/"
        end
        url = url .. health_url
        reqs[count] = { url }
        result[count] = {}
        result[count]["sub_cluster"] = k
        result[count]["url"] = string.sub(url, 8)
        count = count + 1
        if count>=5 then
            --break
        end
    end
    local resps = { ngx.location.capture_multi(reqs) }
    for i, resp in ipairs(resps) do
        print(string.format("subcluster: %s, server: %s, status: %s", result[i]["sub_cluster"], result[i]["url"], resp.status))
        result[i]["status"] = resp.status
    end    
    return result
end

local function format_table_html(tb)
    local html = "<table><tr><th>sub cluster</th><th>url</th><th>status</th></tr>"
    local color
    if(tb == nil) then
        return ""
    end
    for i, resp in ipairs(tb) do
        html = html .. "<tr>"
        if tb[i]["status"] == 200 then
            color = "#00FF00"
        else
            color = "#FF0000"
        end
        html = html .. string.format("<td>%s</td><td>%s</td><td><font color=\"%s\">%s</font></td>", tb[i]["sub_cluster"], 
            tb[i]["url"], color, tb[i]["status"])
        html = html .. "</tr>"
    end       
    html = html .. "</table>"
    print("table html: %s", html)
    return html
end

--return table with properity in filters
local function filter_table(tb, filter)
    if tb == nil or filter == nil then
        return nil
    end
    local ret = {}
    local properity = nil
    for i=1, #filter do
        properity = string.lower(filter[i])
        ret[properity] = tb[properity]
    end
    return ret
end

local function get_health_num(result)
    local total = 0
    local num = 0
    if result then
        total = #result
        for i=1, total do
            if result[i]["status"] == 200 then
                num = num + 1
            end
        end
    end
    print(string.format("get_health_num: %d/%d", num, total))
    return num, total
end


local  _M = {}
_M.check_health = check_health
_M.format_table_html = format_table_html
_M.filter_table = filter_table
_M.get_health_num = get_health_num
return _M