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
import java.util.HashMap;
import java.util.Map;

public class AggregatedFrameworkStatus implements Serializable {
  private FrameworkStatus frameworkStatus;
  // TaskRoleName -> AggregatedTaskRoleStatus
  private Map<String, AggregatedTaskRoleStatus> aggregatedTaskRoleStatuses;

  public static AggregatedFrameworkStatus newInstance(FrameworkRequest frameworkRequest) {
    AggregatedFrameworkStatus aggFrameworkStatus = new AggregatedFrameworkStatus();
    aggFrameworkStatus.setFrameworkStatus(FrameworkStatus.newInstance(frameworkRequest));
    aggFrameworkStatus.setAggregatedTaskRoleStatuses(new HashMap<>());
    return aggFrameworkStatus;
  }

  public FrameworkStatus getFrameworkStatus() {
    return frameworkStatus;
  }

  public void setFrameworkStatus(FrameworkStatus frameworkStatus) {
    this.frameworkStatus = frameworkStatus;
  }

  public Map<String, AggregatedTaskRoleStatus> getAggregatedTaskRoleStatuses() {
    return aggregatedTaskRoleStatuses;
  }

  public void setAggregatedTaskRoleStatuses(Map<String, AggregatedTaskRoleStatus> aggregatedTaskRoleStatuses) {
    this.aggregatedTaskRoleStatuses = aggregatedTaskRoleStatuses;
  }
}
