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

import com.microsoft.frameworklauncher.common.model.LaunchClientType;
import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.HttpStatus;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.BasicResponseHandler;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.message.BasicHeader;

import java.net.SocketException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Callable;

public class WebClient {
  // Each instance of the HttpClient will create a new socket and hold a connection open for a specific interval.
  // To avoid socket exhaustion problem, HttpClient instance need to be shared to use.
  private CloseableHttpClient httpClient;
  private String baseURI;

  public WebClient(String baseURI, LaunchClientType launchClientType, String userName) {
    this.baseURI = baseURI;

    List<Header> headers = new ArrayList<>();
    headers.add(new BasicHeader(WebCommon.REQUEST_HEADER_LAUNCH_CLIENT_TYPE, launchClientType.toString()));
    headers.add(new BasicHeader(WebCommon.REQUEST_HEADER_USER_NAME, userName));

    this.httpClient = HttpClients.custom().setDefaultHeaders(headers).build();
  }

  public WebClientOutput put(String relativeURI, ContentType contentType, String body) {
    HttpPut request = new HttpPut(WebCommon.getURI(baseURI, relativeURI));
    request.setEntity(new StringEntity(body, contentType));
    return execute(() -> httpClient.execute(request));
  }

  public WebClientOutput delete(String relativeURI) {
    HttpDelete request = new HttpDelete(WebCommon.getURI(baseURI, relativeURI));
    return execute(() -> httpClient.execute(request));
  }

  public WebClientOutput get(String relativeURI) {
    return get(relativeURI, null);
  }

  public WebClientOutput get(String relativeURI, Map<String, String> parameters) {
    HttpGet request = new HttpGet(WebCommon.getURI(baseURI, relativeURI, parameters));
    return execute(() -> httpClient.execute(request));
  }

  private static WebClientOutput execute(Callable<HttpResponse> action) {
    try {
      HttpResponse response = action.call();
      String content = new BasicResponseHandler().handleResponse(response);
      int statusCode = response.getStatusLine().getStatusCode();
      return new WebClientOutput(statusCode, content, statusCode >= 200 && statusCode <= 299);
    } catch (Exception e) {
      if (isNetworkError(e)) {
        return new WebClientOutput(HttpStatus.SC_REQUEST_TIMEOUT, e.toString(), false, e);
      } else {
        return new WebClientOutput(HttpStatus.SC_BAD_REQUEST, e.toString(), false, e);
      }
    }
  }

  private static Boolean isNetworkError(Throwable e) {
    if (e instanceof SocketException)
      return true;
    if (e.getCause() != null)
      return isNetworkError(e.getCause());
    return false;
  }
}
