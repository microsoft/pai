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

local jwt = require "resty.jwt"
local validators = require "resty.jwt-validators"

local function check_token()
  local args = ngx.req.get_uri_args()
  local jwt_token = args["token"]
  if not jwt_token then
    ngx.status = ngx.HTTP_FORBIDDEN
    return ngx.exit(ngx.HTTP_OK)
  end
 
  local jwt_secret = os.getenv("JWT_SECRET")
  local node_name = os.getenv("NODE_NAME")

  local claim_spec = {
    sub = validators.equals("log-manager-"..node_name),
    exp = validators.is_not_expired()
  }
  local jwt_obj = jwt:verify(jwt_secret, jwt_token, claim_spec)

  if not jwt_obj["verified"] then
      ngx.status = ngx.HTTP_FORBIDDEN
      ngx.header["Access-Control-Allow-Origin"] = "*";
      return ngx.exit(ngx.HTTP_OK)
  end
end

return {
  check_token = check_token,
}
