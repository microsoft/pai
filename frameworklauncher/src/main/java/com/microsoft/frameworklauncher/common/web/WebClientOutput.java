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

public class WebClientOutput {
  private final int statusCode;
  private final String content;
  private final Boolean isSuccessStatusCode;
  private final Exception clientSideException;

  public WebClientOutput(int statusCode, String content, Boolean isSuccessStatusCode) {
    this(statusCode, content, isSuccessStatusCode, null);
  }

  public WebClientOutput(int statusCode, String content, Boolean isSuccessStatusCode, Exception clientSideException) {
    this.statusCode = statusCode;
    this.content = content;
    this.isSuccessStatusCode = isSuccessStatusCode;
    this.clientSideException = clientSideException;
  }

  public int getStatusCode() {
    return statusCode;
  }

  public String getContent() {
    return content;
  }

  public Boolean isSuccessStatusCode() {
    return isSuccessStatusCode;
  }

  /**
   * If clientSideException is not null, it means the Exception occurred
   * in the Client side during Client request to Server, includes:
   * Serialization, Deserialization, Validation, HttpClient Exceptions.
   */
  public Exception getClientSideException() {
    return clientSideException;
  }

  public String toString() {
    return String.format(
        "HttpStatusCode: %2$s%1$sContent: %3$s%1$sIsSuccessStatusCode: %4$s%1$sClientSideException: %5$s",
        "\n", statusCode, content, isSuccessStatusCode, clientSideException);
  }
}
