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

package com.microsoft.frameworklauncher.common.service;

public class StopStatus {
  private final int code;
  private final Boolean needUnregister;
  private final String unregisterDiagnostics;
  private final Exception exception;

  public StopStatus(int code) {
    this(code, true, null, null);
  }

  public StopStatus(int code, Boolean needUnregister, String unregisterDiagnostics) {
    this(code, needUnregister, unregisterDiagnostics, null);
  }

  public StopStatus(int code, Boolean needUnregister, String unregisterDiagnostics, Exception exception) {
    this.code = code;
    this.needUnregister = needUnregister;
    this.unregisterDiagnostics = unregisterDiagnostics;
    this.exception = exception;
  }

  public int getCode() {
    return code;
  }

  public Boolean getNeedUnregister() {
    return needUnregister;
  }

  public String getUnregisterDiagnostics() {
    return unregisterDiagnostics;
  }

  public Exception getException() {
    return exception;
  }

  public String toString() {
    return String.format(
        "code = [%s], needUnregister = [%s], unregisterDiagnostics = [%s], Exception = [%s]",
        code, needUnregister, unregisterDiagnostics, exception);
  }
}
