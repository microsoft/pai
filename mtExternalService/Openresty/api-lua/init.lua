local route = require "route"

-- get element num of a table
local function get_element_num(tb)
    if tb == nil then
        return 0
    end
    local count=0
    for k,v in pairs(tb) do
         count = count + 1
    end
    return count
end

-- http://www.abc.com/  -> http://www.abc.com
local function trim_endslash(s)
    if(s == nil) then
        return nil
    end
    return s:match "^(.-)/*$"
end

-- load main config
local function load_config()
    local ret = true;
    
    ngx.log(ngx.INFO, "init load config conf/sites-enabled/subclusters_config.json")
    local j = route.load_json("conf/sites-enabled/subclusters_config.json")
    if j == nil then
        ngx.log(ngx.ERR, "load json conf/sites-enabled/subclusters_config.json failed")
        return false
    end
    
    -- load route config
    local mtrest_servers = {}
    local livy_servers = {}
    local launcher_servers = {}
    local mtlogin_server = nil
    local rm_servers = {}
    local httpfs_servers = {}
    local shs_servers = {}
    local clusters = j["Clusters"] or {}
    local cluster = clusters["Cluster"] or {}
    for i=1, #cluster do
        local sub_cluster = string.lower(cluster[i].subCluster)
        if sub_cluster == "default" then
            mtlogin_server = trim_endslash(cluster[i]["RestServerUri"])
            ngx.log(ngx.INFO, string.format("cluster: %s, mtlogin url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["RestServerUri"])))
        else
            mtrest_servers[sub_cluster] = trim_endslash(cluster[i]["RestServerUri"])
            livy_servers[sub_cluster] = trim_endslash(cluster[i]["LivyUri"])
            launcher_servers[sub_cluster] = trim_endslash(cluster[i]["LauncherUri"])
            rm_servers[sub_cluster] = trim_endslash(cluster[i]["ResourceManagerUri"])
            httpfs_servers[sub_cluster] = trim_endslash(cluster[i]["HttpFSUri"])
            shs_servers[sub_cluster] = trim_endslash(cluster[i]["SparkJobHistoryUri"])
            
            ngx.log(ngx.INFO, string.format("cluster: %s, mtrest url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["RestServerUri"])))
            ngx.log(ngx.INFO, string.format("cluster: %s, livy url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["LivyUri"])))
            ngx.log(ngx.INFO, string.format("cluster: %s, launcher url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["LauncherUri"])))
            ngx.log(ngx.INFO, string.format("cluster: %s, rm url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["ResourceManagerUri"])))
            ngx.log(ngx.INFO, string.format("cluster: %s, httpfs url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["HttpFSUri"])))
            ngx.log(ngx.INFO, string.format("cluster: %s, shs url: %s", cluster[i].subCluster, trim_endslash(cluster[i]["SparkJobHistoryUri"])))
        end
    end
    route.set_share_data("mtrest_servers", mtrest_servers)
    route.set_share_data("livy_servers", livy_servers)
    route.set_share_data("launcher_servers", launcher_servers)
    route.set_share_data("mtlogin_server", mtlogin_server)
    route.set_share_data("rm_servers", rm_servers)
    route.set_share_data("httpfs_servers", httpfs_servers)
    route.set_share_data("shs_servers", shs_servers)
    
    ngx.log(ngx.INFO, string.format("load mtrest_servers num: %d", get_element_num(mtrest_servers)))
    ngx.log(ngx.INFO, string.format("load livy_servers num: %d", get_element_num(livy_servers)))
    ngx.log(ngx.INFO, string.format("load launcher_servers num: %d", get_element_num(launcher_servers)))
    ngx.log(ngx.INFO, string.format("load rm_servers num: %d", get_element_num(rm_servers)))
    ngx.log(ngx.INFO, string.format("load httpfs_servers num: %d", get_element_num(httpfs_servers)))
    ngx.log(ngx.INFO, string.format("load shs_servers num: %d", get_element_num(shs_servers)))
    local num_mtlogin = 0
    if mtlogin_server ~= nil then
        num_mtlogin = 1
    end
    ngx.log(ngx.INFO, string.format("load mtlogin_server num: %d", num_mtlogin))

    ngx.log(ngx.INFO, "finish load config conf/sites-enabled/subclusters_config.json")
    
    -- load acl config for mtrest server
    local mtrest_acl = route.load_acl_table("conf/sites-enabled/mtrest_acl.json")
    if mtrest_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/mtrest_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load mtrest_acl succeefully")
        route.set_share_data("mtrest_acl", mtrest_acl)
    end
    
    -- load acl config for livy server
    local livy_acl = route.load_acl_table("conf/sites-enabled/livy_acl.json")
    if livy_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/livy_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load livy_acl succeefully")
        route.set_share_data("livy_acl", livy_acl)
    end
    
    -- load acl config for launcher server
    local launcher_acl = route.load_acl_table("conf/sites-enabled/launcher_acl.json")
    if launcher_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/launcher_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load launcher_acl succeefully")
        route.set_share_data("launcher_acl", launcher_acl)
    end
    
    -- load acl config for mtlogin server
    local mtlogin_acl = route.load_acl_table("conf/sites-enabled/mtlogin_acl.json")
    if mtlogin_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/mtlogin_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load mtlogin_acl succeefully")
        route.set_share_data("mtlogin_acl", mtlogin_acl)
    end

    -- load acl config for resource manager server
    local rm_acl = route.load_acl_table("conf/sites-enabled/rm_acl.json")
    if rm_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/rm_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load rm_acl succeefully")
        route.set_share_data("rm_acl", rm_acl)
    end

    -- load acl config for hdfs http fs server
    local httpfs_acl = route.load_acl_table("conf/sites-enabled/httpfs_acl.json")
    if httpfs_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/httpfs_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load httpfs_acl succeefully")
        route.set_share_data("httpfs_acl", httpfs_acl)
    end

    -- load acl config for spark history server
    local shs_acl = route.load_acl_table("conf/sites-enabled/shs_acl.json")
    if shs_acl == nil then
        ngx.log(ngx.WARN, "load conf/sites-enabled/shs_acl.json failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load shs_acl succeefully")
        route.set_share_data("shs_acl", shs_acl)
    end
    
    -- load mt token public key
    local secret = route.load_file("conf/ssl/public-key.mttoken.pem")
    if secret == nil then
        ngx.log(ngx.WARN, "load conf/ssl/public-key.mttoken.pem failed")
        ret = false
    else
        ngx.log(ngx.INFO, "load secret succeefully")
        route.set_secret(secret)
    end

    -- load health setting
    local health = j["Health"] or {}
    route.set_share_data("health", health)
    
    return ret
end

return load_config()

