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
local jwt = require "resty.jwt"

-- check username & password
local admin_name = os.getenv("ADMIN_NAME")
local admin_password = os.getenv("ADMIN_PASSWORD")
local token_expired_second = os.getenv("TOKEN_EXPIRED_SECOND")
ngx.req.read_body()
local ok, body = pcall(cjson.decode, ngx.req.get_body_data())

if not ok then
  ngx.status = ngx.HTTP_BAD_REQUEST
  return ngx.exit(ngx.HTTP_OK)
end

if body["username"] ~= admin_name or body["password"] ~= admin_password then
  ngx.status = ngx.HTTP_UNAUTHORIZED
  return ngx.exit(ngx.HTTP_OK)
end

-- sign jwt token
local jwt_secret = os.getenv("JWT_SECRET")
local node_name = os.getenv("NODE_NAME")
local jwt_token = jwt:sign(
  jwt_secret,
  {
      header={typ="JWT", alg="HS256"},
      payload={sub="log-manager-"..node_name, iat=os.time(), exp=os.time() + tonumber(token_expired_second)}
  }
)
ngx.say(cjson.encode({token=jwt_token}))
