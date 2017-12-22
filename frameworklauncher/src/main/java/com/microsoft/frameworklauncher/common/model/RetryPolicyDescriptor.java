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

package com.microsoft.frameworklauncher.common.model;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

// If fancyRetryPolicy is enabled,
//  will Retry for TrainsientFailure,
//  will Not Retry for NonTrainsientFailure,
//  will apply NormalRetryPolicy for UnKnownFailure.
//
// If fancyRetryPolicy is not enabled, will apply NormalRetryPolicy for all kinds of failures.
// NormalRetryPolicy is defined as,
//  will Retry and RetriedCount++ if maxRetryCount is equal to -1,
//  will Retry and RetriedCount++ if RetriedCount is less than maxRetryCount,
//  will Not Retry if all previous conditions are not satisfied.
public class RetryPolicyDescriptor implements Serializable {
  @Valid
  @NotNull
  private Integer maxRetryCount = 0;

  @Valid
  @NotNull
  private Boolean fancyRetryPolicy = false;

  public Integer getMaxRetryCount() {
    return maxRetryCount;
  }

  public void setMaxRetryCount(Integer maxRetryCount) {
    this.maxRetryCount = maxRetryCount;
  }

  public Boolean getFancyRetryPolicy() {
    return fancyRetryPolicy;
  }

  public void setFancyRetryPolicy(Boolean fancyRetryPolicy) {
    this.fancyRetryPolicy = fancyRetryPolicy;
  }
}
