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
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.io.Serializable;

/**
 * If FancyRetryPolicy is enabled,
 *  will retry if exit due to transient failure,
 *  will not retry if exit due to non-transient failure,
 *  will apply NormalRetryPolicy if exit due to success or unknown failure,
 *
 * If FancyRetryPolicy is not enabled, will apply NormalRetryPolicy for all kinds of exits.
 * NormalRetryPolicy is defined as,
 *  will retry and retriedCount++ if maxRetryCount == -2,
 *  will retry and retriedCount++ if exit due to failure and maxRetryCount == -1,
 *  will retry and retriedCount++ if exit due to failure and retriedCount < maxRetryCount,
 *  will not retry if all above conditions are not satisfied.
 *
 * For all cases, the final ExitStatus is always the same as the ExitStatus of the last attempt.
 */
public class RetryPolicyDescriptor implements Serializable {
  @Valid
  @NotNull
  private Boolean fancyRetryPolicy = false;

  @Valid
  @NotNull
  @Min(-2)
  private Integer maxRetryCount = 0;

  public Boolean getFancyRetryPolicy() {
    return fancyRetryPolicy;
  }

  public void setFancyRetryPolicy(Boolean fancyRetryPolicy) {
    this.fancyRetryPolicy = fancyRetryPolicy;
  }

  public Integer getMaxRetryCount() {
    return maxRetryCount;
  }

  public void setMaxRetryCount(Integer maxRetryCount) {
    this.maxRetryCount = maxRetryCount;
  }
}
