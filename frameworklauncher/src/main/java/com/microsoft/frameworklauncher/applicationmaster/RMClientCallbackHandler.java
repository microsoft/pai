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

package com.microsoft.frameworklauncher.applicationmaster;

import org.apache.hadoop.yarn.api.records.Container;
import org.apache.hadoop.yarn.api.records.ContainerStatus;
import org.apache.hadoop.yarn.api.records.NodeReport;
import org.apache.hadoop.yarn.api.records.PreemptionMessage;
import org.apache.hadoop.yarn.client.api.async.AMRMClientAsync;

import java.util.List;

public class RMClientCallbackHandler implements AMRMClientAsync.CallbackHandler {
  private final ApplicationMaster am;

  public RMClientCallbackHandler(ApplicationMaster am) {
    this.am = am;
  }

  public void onError(Throwable e) {
    am.onError(e);
  }

  public void onShutdownRequest() {
    am.onShutdownRequest();
  }

  public float getProgress() {
    try {
      return am.getProgress();
    } catch (Exception e) {
      return 0;
    }
  }

  public void onNodesUpdated(List<NodeReport> updatedNodes) {
    am.onNodesUpdated(updatedNodes);
  }

  public void onContainersAllocated(List<Container> allocatedContainers) {
    am.onContainersAllocated(allocatedContainers);
  }

  public void onContainersCompleted(List<ContainerStatus> completedContainers) {
    am.onContainersCompleted(completedContainers);
  }

  public void onPreemptionMessage(PreemptionMessage message) {
    am.onPreemptionMessage(message);
  }
}
