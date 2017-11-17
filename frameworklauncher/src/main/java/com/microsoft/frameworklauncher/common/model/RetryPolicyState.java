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

import java.io.Serializable;

public class RetryPolicyState implements Serializable {
  // If FancyRetryPolicy is enabled, it is the RetriedCount for UnKnownFailure, i.e. UnKnownFailureCount.
  // Otherwise, it is the RetriedCount for all kinds of failures.
  private Integer retriedCount = 0;

  // Below counters are available even if FancyRetryPolicy is not enabled.
  private Integer transientNormalRetriedCount = 0;
  private Integer transientConflictRetriedCount = 0;
  private Integer nonTransientRetriedCount = 0;
  private Integer unKnownRetriedCount = 0;

  public Integer getRetriedCount() {
    return retriedCount;
  }

  public void setRetriedCount(Integer retriedCount) {
    this.retriedCount = retriedCount;
  }

  public Integer getTransientNormalRetriedCount() {
    return transientNormalRetriedCount;
  }

  public void setTransientNormalRetriedCount(Integer transientNormalRetriedCount) {
    this.transientNormalRetriedCount = transientNormalRetriedCount;
  }

  public Integer getTransientConflictRetriedCount() {
    return transientConflictRetriedCount;
  }

  public void setTransientConflictRetriedCount(Integer transientConflictRetriedCount) {
    this.transientConflictRetriedCount = transientConflictRetriedCount;
  }

  public Integer getNonTransientRetriedCount() {
    return nonTransientRetriedCount;
  }

  public void setNonTransientRetriedCount(Integer nonTransientRetriedCount) {
    this.nonTransientRetriedCount = nonTransientRetriedCount;
  }

  public Integer getUnKnownRetriedCount() {
    return unKnownRetriedCount;
  }

  public void setUnKnownRetriedCount(Integer unKnownRetriedCount) {
    this.unKnownRetriedCount = unKnownRetriedCount;
  }
}
