// Copyright (c) Microsoft Corporation
// All rights reserved. 
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated 
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation 
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and 
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING 
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 

package com.microsoft.frameworklauncher.common.web;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.hadoop.net.NetUtils;

import java.io.IOException;
import java.util.Map;

public class WebCommon {
  public static final String REQUEST_HEADER_LAUNCH_CLIENT_TYPE = "LaunchClientType";
  public static final String REQUEST_HEADER_USER_NAME = "UserName";
  public static final int SC_TOO_MANY_REQUESTS = 429;
  private static final ObjectMapper OBJECT_MAPPER;

  static {
    OBJECT_MAPPER = new ObjectMapper();
    OBJECT_MAPPER.disable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES);
  }

  public static String getURI(String baseURI, String relativeURI) {
    return getURI(baseURI, relativeURI, null);
  }

  public static String getURI(String baseURI, String relativeURI, Map<String, String> parameters) {
    String path = WebStructure.getNodePath(baseURI, relativeURI);

    StringBuilder paramsStr = new StringBuilder();
    if (parameters != null) {
      for (Map.Entry<String, String> param : parameters.entrySet()) {
        if (!paramsStr.toString().trim().isEmpty()) {
          paramsStr.append("&");
        }
        paramsStr.append(param.getKey().trim()).append("=").append(param.getValue().trim());
      }
    }

    if (!paramsStr.toString().trim().isEmpty()) {
      return path + "?" + paramsStr;
    } else {
      return path;
    }
  }

  public static String getBindAddress(String bindHost, String address) {
    return bindHost.trim() + ":" + NetUtils.createSocketAddr(address).getPort();
  }

  // Object <-> Json
  // obj can be null, but cannot be Exception
  public static String toJson(Object obj) throws JsonProcessingException {
    return toJson(obj, true);
  }

  public static String toJson(Object obj, Boolean pretty) throws JsonProcessingException {
    if (pretty) {
      return OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
    } else {
      return OBJECT_MAPPER.writeValueAsString(obj);
    }
  }

  // json can be "null"
  public static <T> T toObject(String json, Class<T> targetType) throws IOException {
    return OBJECT_MAPPER.readValue(json, targetType);
  }
}
