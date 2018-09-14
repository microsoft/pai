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

package com.microsoft.frameworklauncher.service;

import com.microsoft.frameworklauncher.common.model.RetryPolicyState;
import org.apache.hadoop.yarn.api.records.ApplicationSubmissionContext;

public class FrameworkEvent {
  private ApplicationSubmissionContext applicationContext;
  private Integer applicationExitCode;
  private String applicationExitDiagnostics;
  private RetryPolicyState newRetryPolicyState;
  private boolean skipToPersist = false;

  public ApplicationSubmissionContext getApplicationContext() {
    return applicationContext;
  }

  public FrameworkEvent setApplicationContext(ApplicationSubmissionContext applicationContext) {
    this.applicationContext = applicationContext;
    return this;
  }

  public Integer getApplicationExitCode() {
    return applicationExitCode;
  }

  public FrameworkEvent setApplicationExitCode(Integer applicationExitCode) {
    this.applicationExitCode = applicationExitCode;
    return this;
  }

  public String getApplicationExitDiagnostics() {
    return applicationExitDiagnostics;
  }

  public FrameworkEvent setApplicationExitDiagnostics(String applicationExitDiagnostics) {
    this.applicationExitDiagnostics = applicationExitDiagnostics;
    return this;
  }

  public RetryPolicyState getNewRetryPolicyState() {
    return newRetryPolicyState;
  }

  public FrameworkEvent setNewRetryPolicyState(RetryPolicyState newRetryPolicyState) {
    this.newRetryPolicyState = newRetryPolicyState;
    return this;
  }

  public boolean getSkipToPersist() {
    return skipToPersist;
  }

  public FrameworkEvent setSkipToPersist(boolean skipToPersist) {
    this.skipToPersist = skipToPersist;
    return this;
  }
}
